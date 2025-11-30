import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

// Default ranking weights - can be overridden via environment variables
const DEFAULT_RANKING_WEIGHTS = {
  recency: 0.3,
  engagement: 0.25,
  socialGraph: 0.2,
  relevance: 0.15,
  academic: 0.1,
};

interface RankingWeights {
  recency: number;
  engagement: number;
  socialGraph: number;
  relevance: number;
  academic: number;
}

interface RankedPost {
  id: string;
  score: number;
  features: PostFeatures;
}

interface PostFeatures {
  recencyScore: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewCount: number;
  userFollowsAuthor: boolean;
  isSameCampus: boolean;
  isSameUniversity: boolean;
  isSameProgram: boolean;
  isSameYear: boolean;
  isAcademic: boolean;
}

@Injectable()
export class RankingService {
  private readonly rankingWeights: RankingWeights;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private configService: ConfigService,
  ) {
    // Load ranking weights from environment or use defaults
    // Can be configured for A/B testing via RANKING_WEIGHT_* env vars
    this.rankingWeights = {
      recency: this.parseWeight('RANKING_WEIGHT_RECENCY', DEFAULT_RANKING_WEIGHTS.recency),
      engagement: this.parseWeight('RANKING_WEIGHT_ENGAGEMENT', DEFAULT_RANKING_WEIGHTS.engagement),
      socialGraph: this.parseWeight('RANKING_WEIGHT_SOCIAL_GRAPH', DEFAULT_RANKING_WEIGHTS.socialGraph),
      relevance: this.parseWeight('RANKING_WEIGHT_RELEVANCE', DEFAULT_RANKING_WEIGHTS.relevance),
      academic: this.parseWeight('RANKING_WEIGHT_ACADEMIC', DEFAULT_RANKING_WEIGHTS.academic),
    };
  }

  private parseWeight(envKey: string, defaultValue: number): number {
    const envValue = this.configService.get<string>(envKey);
    if (envValue) {
      const parsed = parseFloat(envValue);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
    return defaultValue;
  }

  async rankPosts(
    postIds: string[],
    userId: string,
    experimentId?: string,
  ): Promise<string[]> {
    if (postIds.length === 0) return [];

    // Get user info for personalization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        campusId: true,
        universityId: true,
        programId: true,
        year: true,
        following: { select: { followeeId: true } },
      },
    });

    const followingIds = new Set(user?.following.map((f) => f.followeeId) || []);

    // Get posts with features
    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      select: {
        id: true,
        authorId: true,
        campusId: true,
        universityId: true,
        isAcademic: true,
        viewCount: true,
        createdAt: true,
        author: {
          select: {
            programId: true,
            year: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    // Compute features and scores
    const rankedPosts: RankedPost[] = posts.map((post) => {
      const features = this.computeFeatures(post, user, followingIds);
      const score = this.computeScore(features, experimentId);
      return { id: post.id, score, features };
    });

    // Sort by score descending
    rankedPosts.sort((a, b) => b.score - a.score);

    // Log experiment if provided
    if (experimentId) {
      this.logExperiment(experimentId, userId, rankedPosts);
    }

    return rankedPosts.map((p) => p.id);
  }

  private computeFeatures(
    post: Record<string, unknown>,
    user: Record<string, unknown> | null,
    followingIds: Set<string>,
  ): PostFeatures {
    const now = new Date();
    const postCreatedAt = post.createdAt as Date;
    const ageHours = (now.getTime() - postCreatedAt.getTime()) / (1000 * 60 * 60);
    const count = post._count as { likes: number; comments: number; shares: number };
    const author = post.author as { programId?: string; year?: number } | null;

    return {
      recencyScore: Math.exp(-ageHours / 24), // Decay over 24 hours
      likesCount: count?.likes || 0,
      commentsCount: count?.comments || 0,
      sharesCount: count?.shares || 0,
      viewCount: (post.viewCount as number) || 0,
      userFollowsAuthor: followingIds.has(post.authorId as string),
      isSameCampus: user?.campusId === post.campusId,
      isSameUniversity: user?.universityId === post.universityId,
      isSameProgram: user?.programId === author?.programId,
      isSameYear: user?.year === author?.year,
      isAcademic: post.isAcademic as boolean,
    };
  }

  private computeScore(features: PostFeatures, _experimentId?: string): number {
    // Normalize engagement metrics
    const engagementScore =
      Math.log1p(features.likesCount) * 0.4 +
      Math.log1p(features.commentsCount) * 0.4 +
      Math.log1p(features.sharesCount) * 0.2;

    // Social graph score
    const socialScore = features.userFollowsAuthor ? 1 : 0;

    // Relevance score based on similarity
    const relevanceScore =
      (features.isSameCampus ? 0.4 : 0) +
      (features.isSameUniversity ? 0.3 : 0) +
      (features.isSameProgram ? 0.2 : 0) +
      (features.isSameYear ? 0.1 : 0);

    // Academic boost
    const academicScore = features.isAcademic ? 1 : 0;

    // Weighted final score using configurable weights
    const finalScore =
      this.rankingWeights.recency * features.recencyScore +
      this.rankingWeights.engagement * Math.min(engagementScore / 10, 1) +
      this.rankingWeights.socialGraph * socialScore +
      this.rankingWeights.relevance * relevanceScore +
      this.rankingWeights.academic * academicScore;

    return finalScore;
  }

  private async logExperiment(
    experimentId: string,
    userId: string,
    rankedPosts: RankedPost[],
  ) {
    // Log to analytics for A/B testing
    await this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: 'ranking.experiment',
        data: {
          experimentId,
          postCount: rankedPosts.length,
          topPosts: rankedPosts.slice(0, 5).map((p) => ({
            id: p.id,
            score: p.score,
          })),
        },
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { RankingService } from './ranking.service';
import { FeedQueryDto } from './dto/feed.dto';

enum Visibility {
  CAMPUS = 'CAMPUS',
  UNIVERSITY = 'UNIVERSITY',
  PROVINCE = 'PROVINCE',
  NATIONAL = 'NATIONAL',
}

// Feed composition weights
const FEED_MIX = {
  campus: 0.4,
  university: 0.2,
  socialGraph: 0.2,
  trending: 0.2,
};

@Injectable()
export class FeedsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private rankingService: RankingService,
  ) {}

  async getCampusFeed(campusId: string, userId: string, dto: FeedQueryDto, experimentId?: string) {
    const { limit = 20, cursor } = dto;

    const posts = await this.prisma.post.findMany({
      where: {
        campusId,
        moderationStatus: 'APPROVED',
        visibility: { in: [Visibility.CAMPUS, Visibility.UNIVERSITY, Visibility.PROVINCE, Visibility.NATIONAL] },
      },
      take: limit * 2, // Get more for ranking
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const postIds = posts.map((p) => p.id);
    const rankedIds = await this.rankingService.rankPosts(postIds, userId, experimentId);
    const rankedIdsLimited = rankedIds.slice(0, limit + 1);

    return this.fetchAndFormatPosts(rankedIdsLimited, userId, limit);
  }

  async getUniversityFeed(universityId: string, userId: string, dto: FeedQueryDto, experimentId?: string) {
    const { limit = 20, cursor } = dto;

    const posts = await this.prisma.post.findMany({
      where: {
        universityId,
        moderationStatus: 'APPROVED',
        visibility: { in: [Visibility.UNIVERSITY, Visibility.PROVINCE, Visibility.NATIONAL] },
      },
      take: limit * 2,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const postIds = posts.map((p) => p.id);
    const rankedIds = await this.rankingService.rankPosts(postIds, userId, experimentId);
    const rankedIdsLimited = rankedIds.slice(0, limit + 1);

    return this.fetchAndFormatPosts(rankedIdsLimited, userId, limit);
  }

  async getProvinceFeed(province: string, userId: string, dto: FeedQueryDto, experimentId?: string) {
    const { limit = 20, cursor } = dto;

    const posts = await this.prisma.post.findMany({
      where: {
        province,
        moderationStatus: 'APPROVED',
        visibility: { in: [Visibility.PROVINCE, Visibility.NATIONAL] },
      },
      take: limit * 2,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const postIds = posts.map((p) => p.id);
    const rankedIds = await this.rankingService.rankPosts(postIds, userId, experimentId);
    const rankedIdsLimited = rankedIds.slice(0, limit + 1);

    return this.fetchAndFormatPosts(rankedIdsLimited, userId, limit);
  }

  async getNationalFeed(userId: string, dto: FeedQueryDto, experimentId?: string) {
    const { limit = 20, cursor } = dto;

    const posts = await this.prisma.post.findMany({
      where: {
        moderationStatus: 'APPROVED',
        visibility: Visibility.NATIONAL,
      },
      take: limit * 2,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const postIds = posts.map((p) => p.id);
    const rankedIds = await this.rankingService.rankPosts(postIds, userId, experimentId);
    const rankedIdsLimited = rankedIds.slice(0, limit + 1);

    return this.fetchAndFormatPosts(rankedIdsLimited, userId, limit);
  }

  async getPersonalizedFeed(userId: string, dto: FeedQueryDto, experimentId?: string) {
    const { limit = 20, cursor } = dto;

    // Get user's context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        university: true,
        following: { select: { followeeId: true } },
      },
    });

    if (!user) {
      return { items: [], hasMore: false };
    }

    // Generate candidates from different sources
    const candidateCount = Math.ceil(limit * 2.5);
    const candidates: string[] = [];

    // Campus candidates
    if (user.campusId) {
      const campusPosts = await this.getCandidatesFromCampus(user.campusId, Math.ceil(candidateCount * FEED_MIX.campus));
      candidates.push(...campusPosts);
    }

    // University candidates
    if (user.universityId) {
      const universityPosts = await this.getCandidatesFromUniversity(user.universityId, Math.ceil(candidateCount * FEED_MIX.university));
      candidates.push(...universityPosts);
    }

    // Social graph candidates
    const followingIds = user.following.map((f) => f.followeeId);
    if (followingIds.length > 0) {
      const socialPosts = await this.getCandidatesFromSocialGraph(followingIds, Math.ceil(candidateCount * FEED_MIX.socialGraph));
      candidates.push(...socialPosts);
    }

    // Trending candidates
    const trendingPosts = await this.getCandidatesFromTrending(Math.ceil(candidateCount * FEED_MIX.trending));
    candidates.push(...trendingPosts);

    // Deduplicate
    const uniqueCandidates = [...new Set(candidates)];

    // Rank and return
    const rankedIds = await this.rankingService.rankPosts(uniqueCandidates, userId, experimentId);
    const rankedIdsLimited = rankedIds.slice(0, limit + 1);

    return this.fetchAndFormatPosts(rankedIdsLimited, userId, limit);
  }

  private async getCandidatesFromCampus(campusId: string, count: number): Promise<string[]> {
    const posts = await this.prisma.post.findMany({
      where: { campusId, moderationStatus: 'APPROVED' },
      take: count,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    return posts.map((p) => p.id);
  }

  private async getCandidatesFromUniversity(universityId: string, count: number): Promise<string[]> {
    const posts = await this.prisma.post.findMany({
      where: { universityId, moderationStatus: 'APPROVED' },
      take: count,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    return posts.map((p) => p.id);
  }

  private async getCandidatesFromSocialGraph(followingIds: string[], count: number): Promise<string[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        authorId: { in: followingIds },
        moderationStatus: 'APPROVED',
      },
      take: count,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    return posts.map((p) => p.id);
  }

  private async getCandidatesFromTrending(count: number): Promise<string[]> {
    // Get posts with high engagement in last 72 hours
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: { gte: since },
        moderationStatus: 'APPROVED',
      },
      take: count,
      orderBy: [
        { viewCount: 'desc' },
      ],
      select: { id: true },
    });
    return posts.map((p) => p.id);
  }

  private async fetchAndFormatPosts(postIds: string[], userId: string, limit: number) {
    if (postIds.length === 0) {
      return { items: [], hasMore: false };
    }

    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
          },
        },
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    // Maintain ranked order
    const postMap = new Map(posts.map((p) => [p.id, p]));
    const orderedPosts = postIds.map((id) => postMap.get(id)).filter(Boolean);

    const hasMore = orderedPosts.length > limit;
    const items = hasMore ? orderedPosts.slice(0, limit) : orderedPosts;

    // Get likes and saves for current user
    const postIdsForUser = items.map((p) => p!.id);
    const [likes, saves] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId, postId: { in: postIdsForUser } },
      }),
      this.prisma.savedPost.findMany({
        where: { userId, postId: { in: postIdsForUser } },
      }),
    ]);

    const likedPostIds = new Set(likes.map((l) => l.postId));
    const savedPostIds = new Set(saves.map((s) => s.postId));

    const formattedItems = items.map((post) => ({
      ...post,
      likesCount: post!._count.likes,
      commentsCount: post!._count.comments,
      sharesCount: post!._count.shares,
      isLiked: likedPostIds.has(post!.id),
      isSaved: savedPostIds.has(post!.id),
    }));

    return {
      items: formattedItems,
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, SharePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreatePostDto) {
    // Get author's campus, university, and province
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      include: {
        university: true,
        campus: true,
      },
    });

    if (!author) {
      throw new NotFoundException('User not found');
    }

    const post = await this.prisma.post.create({
      data: {
        authorId,
        content: dto.content,
        isAcademic: dto.isAcademic || false,
        visibility: dto.visibility || 'CAMPUS',
        tags: dto.tags || [],
        campusId: author.campusId,
        universityId: author.universityId,
        province: author.university?.province,
        media: dto.mediaIds?.length
          ? {
              connect: dto.mediaIds.map((id) => ({ id })),
            }
          : undefined,
      },
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

    return this.formatPost(post, authorId);
  }

  async findById(postId: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
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

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count
    await this.prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });

    return this.formatPost(post, userId);
  }

  async update(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: dto,
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

    return this.formatPost(updatedPost, userId);
  }

  async delete(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Allow deletion by author or admin/moderator
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (post.authorId !== userId && user?.role === 'USER') {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: 'Post deleted successfully' };
  }

  async like(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    }

    // Like
    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    // Create notification
    if (post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'like',
          title: 'New like',
          body: 'Someone liked your post',
          data: { postId, userId },
        },
      });
    }

    return { liked: true };
  }

  async comment(postId: string, userId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        userId,
        content: dto.content,
        parentId: dto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create notification
    if (post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'comment',
          title: 'New comment',
          body: 'Someone commented on your post',
          data: { postId, commentId: comment.id, userId },
        },
      });
    }

    return comment;
  }

  async getComments(postId: string, limit = 20, cursor?: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, parentId: null },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, -1) : comments;

    return {
      items,
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async share(postId: string, userId: string, dto: SharePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const share = await this.prisma.share.create({
      data: {
        postId,
        userId,
        content: dto.content,
      },
    });

    // Create notification
    if (post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'share',
          title: 'Post shared',
          body: 'Someone shared your post',
          data: { postId, shareId: share.id, userId },
        },
      });
    }

    return share;
  }

  async save(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingSave = await this.prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingSave) {
      // Unsave
      await this.prisma.savedPost.delete({
        where: { id: existingSave.id },
      });
      return { saved: false };
    }

    // Save
    await this.prisma.savedPost.create({
      data: {
        userId,
        postId,
      },
    });

    return { saved: true };
  }

  async getSavedPosts(userId: string, limit = 20, cursor?: string) {
    const savedPosts = await this.prisma.savedPost.findMany({
      where: { userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
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
        },
      },
    });

    const hasMore = savedPosts.length > limit;
    const items = hasMore ? savedPosts.slice(0, -1) : savedPosts;

    return {
      items: items.map((sp) => this.formatPost(sp.post, userId)),
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async report(postId: string, userId: string, reason: string, details?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.report.create({
      data: {
        reporterId: userId,
        postId,
        reason: reason as 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'OTHER',
        details,
      },
    });

    return { message: 'Report submitted successfully' };
  }

  private async formatPost(post: Record<string, unknown>, userId?: string) {
    let isLiked = false;
    let isSaved = false;

    if (userId) {
      const [like, save] = await Promise.all([
        this.prisma.like.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: post.id as string,
            },
          },
        }),
        this.prisma.savedPost.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: post.id as string,
            },
          },
        }),
      ]);

      isLiked = !!like;
      isSaved = !!save;
    }

    const count = post._count as { likes: number; comments: number; shares: number };

    return {
      ...post,
      likesCount: count?.likes || 0,
      commentsCount: count?.comments || 0,
      sharesCount: count?.shares || 0,
      isLiked,
      isSaved,
    };
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateUserDto, SearchUsersDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        universityId: true,
        campusId: true,
        programId: true,
        year: true,
        verified: true,
        verificationType: true,
        bio: true,
        interests: true,
        role: true,
        createdAt: true,
        university: { select: { id: true, name: true, province: true } },
        campus: { select: { id: true, name: true } },
        program: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async search(dto: SearchUsersDto) {
    const { q, universityId, campusId, programId, year, limit = 20, cursor } = dto;

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (universityId) where.universityId = universityId;
    if (campusId) where.campusId = campusId;
    if (programId) where.programId = programId;
    if (year) where.year = year;

    const users = await this.prisma.user.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        universityId: true,
        campusId: true,
        programId: true,
        year: true,
        verified: true,
        bio: true,
        interests: true,
        createdAt: true,
        university: { select: { id: true, name: true } },
        campus: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, -1) : users;

    return {
      items,
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async update(userId: string, currentUserId: string, dto: UpdateUserDto) {
    if (userId !== currentUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        universityId: true,
        campusId: true,
        programId: true,
        year: true,
        verified: true,
        verificationType: true,
        bio: true,
        interests: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async follow(followerId: string, followeeId: string) {
    if (followerId === followeeId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const followee = await this.prisma.user.findUnique({
      where: { id: followeeId },
    });

    if (!followee) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await this.prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return { following: false };
    }

    // Follow
    await this.prisma.follow.create({
      data: {
        followerId,
        followeeId,
      },
    });

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId: followeeId,
        type: 'follow',
        title: 'New follower',
        body: `Someone started following you`,
        data: { followerId },
      },
    });

    return { following: true };
  }

  async getFollowers(userId: string, limit = 20, cursor?: string) {
    const followers = await this.prisma.follow.findMany({
      where: { followeeId: userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            university: { select: { name: true } },
          },
        },
      },
    });

    const hasMore = followers.length > limit;
    const items = hasMore ? followers.slice(0, -1) : followers;

    return {
      items: items.map((f) => f.follower),
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async getFollowing(userId: string, limit = 20, cursor?: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        followee: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            university: { select: { name: true } },
          },
        },
      },
    });

    const hasMore = following.length > limit;
    const items = hasMore ? following.slice(0, -1) : following;

    return {
      items: items.map((f) => f.followee),
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async isFollowing(followerId: string, followeeId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });

    return { following: !!follow };
  }
}

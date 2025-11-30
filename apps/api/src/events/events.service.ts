import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...dto,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
            university: { select: { name: true } },
          },
        },
      },
    });
  }

  async findById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
            university: { select: { name: true } },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async search(query: {
    campusId?: string;
    universityId?: string;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { campusId, universityId, from, to, limit = 20, cursor } = query;

    const where: Record<string, unknown> = {};

    if (campusId) {
      where.campusId = campusId;
    } else if (universityId) {
      where.campus = { universityId };
    }

    if (from) {
      where.startAt = { gte: new Date(from) };
    }

    if (to) {
      where.endAt = { lte: new Date(to) };
    }

    const events = await this.prisma.event.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { startAt: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, -1) : events;

    return {
      items,
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async delete(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is creator or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (event.createdBy !== userId && user?.role === 'USER') {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.event.delete({ where: { id } });
    return { message: 'Event deleted' };
  }
}

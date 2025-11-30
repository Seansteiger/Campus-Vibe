import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class OpportunitiesService {
  constructor(private prisma: PrismaService) {}

  async search(query: {
    type?: string;
    fieldTags?: string[];
    province?: string;
    yearMin?: number;
    yearMax?: number;
    limit?: number;
    cursor?: string;
  }) {
    const { type, fieldTags, province, yearMin, yearMax, limit = 20, cursor } = query;

    const where: Record<string, unknown> = {
      deadline: { gte: new Date() }, // Only show non-expired
    };

    if (type) where.type = type;
    if (province) where.provinces = { has: province };
    if (fieldTags?.length) where.fieldTags = { hasSome: fieldTags };
    if (yearMin) where.yearMin = { lte: yearMin };
    if (yearMax) where.yearMax = { gte: yearMax };

    const opportunities = await this.prisma.opportunity.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { deadline: 'asc' },
    });

    const hasMore = opportunities.length > limit;
    const items = hasMore ? opportunities.slice(0, -1) : opportunities;

    return {
      items,
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async findById(id: string) {
    return this.prisma.opportunity.findUnique({
      where: { id },
    });
  }

  async matchToUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        program: true,
        university: true,
      },
    });

    if (!user) return { items: [] };

    // Build matching criteria
    const fieldTags: string[] = [];
    if (user.program?.name) {
      fieldTags.push(user.program.name.toLowerCase());
    }
    if (user.interests?.length) {
      fieldTags.push(...user.interests.map((i) => i.toLowerCase()));
    }

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        deadline: { gte: new Date() },
        OR: [
          { fieldTags: { hasSome: fieldTags } },
          { fieldTags: { has: 'all-fields' } },
        ],
        AND: [
          { OR: [{ yearMin: null }, { yearMin: { lte: user.year || 1 } }] },
          { OR: [{ yearMax: null }, { yearMax: { gte: user.year || 1 } }] },
        ],
      },
      take: 20,
      orderBy: { deadline: 'asc' },
    });

    return { items: opportunities };
  }

  // Called by scraper/cron
  async ingest(data: {
    title: string;
    description: string;
    sourceUrl: string;
    fieldTags: string[];
    yearMin?: number;
    yearMax?: number;
    deadline?: string;
    provider?: string;
    type?: string;
    provinces?: string[];
  }) {
    // Check for duplicate by sourceUrl
    const existing = await this.prisma.opportunity.findFirst({
      where: { sourceUrl: data.sourceUrl },
    });

    if (existing) {
      // Update existing
      return this.prisma.opportunity.update({
        where: { id: existing.id },
        data: {
          ...data,
          deadline: data.deadline ? new Date(data.deadline) : null,
        },
      });
    }

    return this.prisma.opportunity.create({
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });
  }
}

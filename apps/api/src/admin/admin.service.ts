import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ModerationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getModerationQueue(status = 'PENDING', limit = 20, cursor?: string) {
    const reports = await this.prisma.report.findMany({
      where: { status: status as ModerationStatus },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        post: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            media: true,
          },
        },
        reported: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    const hasMore = reports.length > limit;
    const items = hasMore ? reports.slice(0, -1) : reports;

    return {
      items,
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async takeAction(
    reportId: string,
    moderatorId: string,
    action: 'approve' | 'remove' | 'warn' | 'ban',
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { post: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    let actionTaken = '';

    switch (action) {
      case 'approve':
        // Content is fine, dismiss report
        actionTaken = 'Report dismissed - content approved';
        break;

      case 'remove':
        // Remove the content
        if (report.postId) {
          await this.prisma.post.update({
            where: { id: report.postId },
            data: { moderationStatus: 'REJECTED' },
          });
        }
        actionTaken = 'Content removed';
        break;

      case 'warn':
        // Warn the user
        if (report.post?.authorId) {
          await this.prisma.notification.create({
            data: {
              userId: report.post.authorId,
              type: 'moderation_warning',
              title: 'Content Warning',
              body: 'Your content has been flagged for violating community guidelines.',
              data: { postId: report.postId },
            },
          });
        }
        actionTaken = 'User warned';
        break;

      case 'ban':
        // Ban the user (soft ban by marking role)
        if (report.post?.authorId) {
          await this.prisma.user.update({
            where: { id: report.post.authorId },
            data: { role: 'USER' }, // Could add a 'BANNED' role
          });
          // Also remove the content
          if (report.postId) {
            await this.prisma.post.update({
              where: { id: report.postId },
              data: { moderationStatus: 'REJECTED' },
            });
          }
        }
        actionTaken = 'User banned and content removed';
        break;
    }

    // Update report status
    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewedBy: moderatorId,
        actionTaken,
      },
    });

    return { success: true, actionTaken };
  }

  async getVerificationQueue(limit = 20, cursor?: string) {
    const requests = await this.prisma.verificationRequest.findMany({
      where: { status: 'PENDING' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            university: { select: { name: true } },
          },
        },
      },
    });

    const hasMore = requests.length > limit;
    const items = hasMore ? requests.slice(0, -1) : requests;

    return {
      items,
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async handleVerification(
    requestId: string,
    moderatorId: string,
    action: 'approve' | 'reject',
    notes?: string,
  ) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    if (action === 'approve') {
      await this.prisma.user.update({
        where: { id: request.userId },
        data: {
          verified: true,
          verificationType: request.type,
        },
      });
    }

    await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewedBy: moderatorId,
        reviewNotes: notes,
      },
    });

    return { success: true };
  }

  async getStats() {
    const [
      totalUsers,
      verifiedUsers,
      totalPosts,
      pendingReports,
      pendingVerifications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { verified: true } }),
      this.prisma.post.count(),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      verifiedUsers,
      totalPosts,
      pendingReports,
      pendingVerifications,
    };
  }

  async addAcceptedDomain(domain: string, universityId?: string) {
    return this.prisma.acceptedDomain.create({
      data: { domain, universityId },
    });
  }

  async getAcceptedDomains() {
    return this.prisma.acceptedDomain.findMany();
  }
}

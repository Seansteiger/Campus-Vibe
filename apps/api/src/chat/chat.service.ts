import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateChatDto, SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async createChat(userId: string, dto: CreateChatDto) {
    const { memberIds, isGroup, name } = dto;

    // Include current user in members
    const allMemberIds = [...new Set([userId, ...memberIds])];

    // For 1:1 chats, check if one already exists
    if (!isGroup && allMemberIds.length === 2) {
      const existingChat = await this.findDirectChat(allMemberIds[0], allMemberIds[1]);
      if (existingChat) {
        return existingChat;
      }
    }

    // Validate members exist
    const members = await this.prisma.user.findMany({
      where: { id: { in: allMemberIds } },
    });

    if (members.length !== allMemberIds.length) {
      throw new BadRequestException('One or more members not found');
    }

    // Create chat with members
    const chat = await this.prisma.chat.create({
      data: {
        isGroup: isGroup || allMemberIds.length > 2,
        name: isGroup ? name : null,
        members: {
          create: allMemberIds.map((memberId) => ({
            userId: memberId,
            isAdmin: memberId === userId,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return this.formatChat(chat);
  }

  async findDirectChat(userId1: string, userId2: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        isGroup: false,
        members: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Find chat with exactly these two members
    const chat = chats.find((c) => c.members.length === 2);
    return chat ? this.formatChat(chat) : null;
  }

  async getUserChats(userId: string, limit = 20, cursor?: string) {
    const chatMembers = await this.prisma.chatMember.findMany({
      where: { userId, leftAt: null },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { joinedAt: 'desc' },
      include: {
        chat: {
          include: {
            members: {
              where: { leftAt: null },
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const hasMore = chatMembers.length > limit;
    const items = hasMore ? chatMembers.slice(0, -1) : chatMembers;

    return {
      items: items.map((cm) => this.formatChat(cm.chat, userId)),
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify user is a member
    const isMember = chat.members.some((m) => m.userId === userId && !m.leftAt);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    return this.formatChat(chat, userId);
  }

  async getMessages(chatId: string, userId: string, limit = 50, cursor?: string) {
    // Verify membership
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!membership || membership.leftAt) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        media: true,
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;

    return {
      items: items.reverse(), // Return in chronological order
      hasMore,
      cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async sendMessage(chatId: string, userId: string, dto: SendMessageDto) {
    // Verify membership
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!membership || membership.leftAt) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    if (!dto.content && !dto.mediaUrl) {
      throw new BadRequestException('Message must have content or media');
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        readBy: [userId],
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update chat timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async markAsRead(chatId: string, userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        NOT: { readBy: { has: userId } },
      },
    });

    for (const message of messages) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          readBy: { push: userId },
        },
      });
    }

    return { success: true };
  }

  async leaveChat(chatId: string, userId: string) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!membership) {
      throw new NotFoundException('Chat membership not found');
    }

    await this.prisma.chatMember.update({
      where: { id: membership.id },
      data: { leftAt: new Date() },
    });

    return { success: true };
  }

  private formatChat(chat: Record<string, unknown>, currentUserId?: string) {
    const members = chat.members as Array<{ user: Record<string, unknown>; userId: string; leftAt: Date | null }>;
    const messages = chat.messages as Array<Record<string, unknown>> | undefined;

    return {
      id: chat.id,
      isGroup: chat.isGroup,
      name: chat.name,
      avatarUrl: chat.avatarUrl,
      members: members
        .filter((m) => !m.leftAt)
        .map((m) => m.user),
      lastMessage: messages?.[0] || null,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }
}

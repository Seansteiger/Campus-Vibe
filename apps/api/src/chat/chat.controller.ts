import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('chat')
@Controller({ path: 'chats', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: 201, description: 'Chat created' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChatDto,
  ) {
    return this.chatService.createChat(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user chats' })
  @ApiResponse({ status: 200, description: 'List of chats' })
  async getChats(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getUserChats(userId, limit, cursor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by ID' })
  @ApiResponse({ status: 200, description: 'Chat found' })
  async getChat(
    @Param('id') chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getChatById(chatId, userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Param('id') chatId: string,
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getMessages(chatId, userId, limit, cursor);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Param('id') chatId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(chatId, userId, dto);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @Param('id') chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.markAsRead(chatId, userId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a chat' })
  @ApiResponse({ status: 200, description: 'Left chat' })
  async leaveChat(
    @Param('id') chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.leaveChat(chatId, userId);
  }
}

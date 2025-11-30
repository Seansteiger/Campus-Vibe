import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET') || 'campus-vibe-secret',
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // Track socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      // Update presence in Redis
      await this.redis.hset('presence', userId, JSON.stringify({
        online: true,
        lastSeen: new Date().toISOString(),
      }));

      // Notify others
      this.server.emit('user:online', { userId });

      console.log(`User ${userId} connected via socket ${client.id}`);
    } catch (error) {
      console.error('Socket auth failed:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    // Remove socket from tracking
    this.userSockets.get(userId)?.delete(client.id);

    // If no more sockets, mark offline
    if (this.userSockets.get(userId)?.size === 0) {
      this.userSockets.delete(userId);

      // Update presence
      await this.redis.hset('presence', userId, JSON.stringify({
        online: false,
        lastSeen: new Date().toISOString(),
      }));

      // Notify others
      this.server.emit('user:offline', { userId });
    }

    console.log(`User ${userId} disconnected from socket ${client.id}`);
  }

  @SubscribeMessage('chat:join')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Verify user is member of chat
    try {
      await this.chatService.getChatById(data.chatId, userId);
      client.join(`chat:${data.chatId}`);
      return { success: true };
    } catch {
      return { success: false, error: 'Not a member of this chat' };
    }
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
    return { success: true };
  }

  @SubscribeMessage('chat:message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; content?: string; mediaUrl?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const message = await this.chatService.sendMessage(data.chatId, userId, {
        content: data.content,
        mediaUrl: data.mediaUrl,
      });

      // Broadcast to room
      this.server.to(`chat:${data.chatId}`).emit('chat:message:new', message);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('chat:typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`chat:${data.chatId}`).emit('chat:typing:start', { userId, chatId: data.chatId });
  }

  @SubscribeMessage('chat:typing:end')
  handleTypingEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`chat:${data.chatId}`).emit('chat:typing:end', { userId, chatId: data.chatId });
  }

  // Helper to send to specific user
  sendToUser(userId: string, event: string, data: unknown) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size ?? 0) > 0;
  }
}

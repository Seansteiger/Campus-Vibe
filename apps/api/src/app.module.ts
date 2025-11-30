import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { MediaModule } from './media/media.module';
import { FeedsModule } from './feeds/feeds.module';
import { ChatModule } from './chat/chat.module';
import { EventsModule } from './events/events.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PostsModule,
    MediaModule,
    FeedsModule,
    ChatModule,
    EventsModule,
    OpportunitiesModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}

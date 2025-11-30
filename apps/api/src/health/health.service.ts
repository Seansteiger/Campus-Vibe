import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
      },
    };

    const allHealthy = Object.values(checks.services).every((s) => s.status === 'ok');
    checks.status = allHealthy ? 'ok' : 'degraded';

    return checks;
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', error: (error as Error).message };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.set('health_check', 'ok', 10);
      const value = await this.redis.get('health_check');
      return { status: value === 'ok' ? 'ok' : 'error' };
    } catch (error) {
      return { status: 'error', error: (error as Error).message };
    }
  }

  getMetrics() {
    // Simple metrics for now - can be expanded with Prometheus format
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

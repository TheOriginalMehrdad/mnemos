import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';
import { REDIS_CLIENT } from '../redis/redis.module';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Liveness/readiness probe. Returns 200 with the status of each dependency.
   */
  @Public()
  @Get()
  async check(): Promise<{ status: string; db: string; redis: string; uptime: number }> {
    const [db, redis] = await Promise.all([this.pingDb(), this.pingRedis()]);
    return { status: 'ok', db, redis, uptime: Math.round(process.uptime()) };
  }

  private async pingDb(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async pingRedis(): Promise<string> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}

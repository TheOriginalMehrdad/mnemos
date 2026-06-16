import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { AppConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AiModule } from './ai/ai.module';
import { AiHttpModule } from './ai/ai-http.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { NotesModule } from './notes/notes.module';
import { CardsModule } from './cards/cards.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { HealthModule } from './health/health.module';
import { RealtimeModule } from './realtime/realtime.module';
import { JobsModule } from './jobs/jobs.module';
import { VaultModule } from './vault/vault.module';
import { ReviewModule } from './review/review.module';
import { GraphModule } from './graph/graph.module';
import { StatsModule } from './stats/stats.module';
import { LanguagesModule } from './languages/languages.module';
import { SingleUserGuard } from './common/guards/single-user.guard';

@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    PrismaModule,
    RedisModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.get<string>('redis.url') ?? 'redis://localhost:6379');
        return {
          connection: {
            host: url.hostname,
            port: url.port ? Number(url.port) : 6379,
            password: url.password || undefined,
          },
        };
      },
    }),
    AiModule,
    AiHttpModule,
    AuthModule,
    UserModule,
    NotesModule,
    CardsModule,
    QuizzesModule,
    HealthModule,
    RealtimeModule,
    JobsModule,
    VaultModule,
    ReviewModule,
    GraphModule,
    StatsModule,
    LanguagesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SingleUserGuard,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiFacadeService } from './ai-facade.service';

/** HTTP surface for the (stubbed) AI features. AiModule provides AI_PROVIDER globally. */
@Module({
  controllers: [AiController],
  providers: [AiFacadeService],
})
export class AiHttpModule {}

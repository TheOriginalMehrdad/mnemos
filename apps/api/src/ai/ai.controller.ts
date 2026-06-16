import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiFacadeService } from './ai-facade.service';
import { GenerateCardsDto, GenerateQuizDto, SummarizeDto, SearchDto } from './dto/ai.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiFacadeService) {}

  @Post('generate-cards')
  @HttpCode(HttpStatus.OK)
  generateCards(@CurrentUser() u: { id: string }, @Body() dto: GenerateCardsDto) {
    return this.ai.generateCards(u.id, dto);
  }

  @Post('generate-quiz')
  @HttpCode(HttpStatus.OK)
  generateQuiz(@CurrentUser() u: { id: string }, @Body() dto: GenerateQuizDto) {
    return this.ai.generateQuiz(u.id, dto);
  }

  @Post('summarize')
  @HttpCode(HttpStatus.OK)
  summarize(@CurrentUser() u: { id: string }, @Body() dto: SummarizeDto) {
    return this.ai.summarize(u.id, dto);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@CurrentUser() u: { id: string }, @Body() dto: SearchDto) {
    return this.ai.search(u.id, dto);
  }

  @Get('daily-insight')
  dailyInsight(@CurrentUser() u: { id: string }) {
    return this.ai.dailyInsight(u.id);
  }
}

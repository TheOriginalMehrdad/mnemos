import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { AdaptiveQueueService } from './adaptive-queue.service';
import { RateCardDto } from '../cards/dto/rate-card.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('review')
@ApiBearerAuth()
@Controller('review')
export class ReviewController {
  constructor(
    private readonly review: ReviewService,
    private readonly queue: AdaptiveQueueService,
  ) {}

  @Get('queue')
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'language', required: false })
  queueForSession(
    @CurrentUser() u: { id: string },
    @Query('limit') limit?: string,
    @Query('domain') domain?: string,
    @Query('language') language?: string,
  ) {
    return this.queue.buildQueue(u.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      domain,
      language,
    });
  }

  @Post(':cardId/rate')
  @HttpCode(HttpStatus.OK)
  rate(@CurrentUser() u: { id: string }, @Param('cardId') cardId: string, @Body() dto: RateCardDto) {
    return this.review.rate(u.id, cardId, dto);
  }

  @Get('stats/today')
  statsToday(@CurrentUser() u: { id: string }) {
    return this.review.statsToday(u.id);
  }

  @Get('stats/range')
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  statsRange(@CurrentUser() u: { id: string }, @Query('from') from: string, @Query('to') to: string) {
    return this.review.statsRange(u.id, new Date(from), new Date(to));
  }
}

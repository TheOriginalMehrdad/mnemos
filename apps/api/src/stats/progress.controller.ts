import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('overview')
  overview(@CurrentUser() u: { id: string }) {
    return this.progress.overview(u.id);
  }

  @Get('domains')
  domains(@CurrentUser() u: { id: string }) {
    return this.progress.domains(u.id);
  }

  @Get('heatmap')
  @ApiQuery({ name: 'weeks', required: false })
  heatmap(@CurrentUser() u: { id: string }, @Query('weeks') weeks?: string) {
    return this.progress.heatmap(u.id, weeks ? parseInt(weeks, 10) : undefined);
  }
}

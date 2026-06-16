import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GraphService } from './graph.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('graph')
@ApiBearerAuth()
@Controller('graph')
export class GraphController {
  constructor(private readonly graph: GraphService) {}

  @Get()
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'minConnections', required: false })
  get(
    @CurrentUser() u: { id: string },
    @Query('domain') domain?: string,
    @Query('minConnections') minConnections?: string,
  ) {
    return this.graph.buildGraph(u.id, {
      domain,
      minConnections: minConnections ? parseInt(minConnections, 10) : undefined,
    });
  }
}

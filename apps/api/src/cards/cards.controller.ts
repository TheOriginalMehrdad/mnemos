import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { RateCardDto } from './dto/rate-card.dto';
import { UpdateCardDto, BulkImportDto } from './dto/update-card.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('cards')
@ApiBearerAuth()
@Controller('cards')
export class CardsController {
  constructor(private cards: CardsService) {}

  @Get()
  @ApiQuery({ name: 'due', required: false, type: Boolean })
  @ApiQuery({ name: 'suspended', required: false, type: Boolean })
  @ApiQuery({ name: 'noteId', required: false })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'language', required: false })
  list(
    @CurrentUser() u: { id: string },
    @Query('due') due?: string,
    @Query('suspended') suspended?: string,
    @Query('noteId') noteId?: string,
    @Query('domain') domain?: string,
    @Query('type') type?: string,
    @Query('language') language?: string,
  ) {
    return this.cards.list(u.id, {
      due: due === 'true',
      suspended: suspended === undefined ? undefined : suspended === 'true',
      noteId,
      domain,
      type,
      language,
    });
  }

  @Get('session')
  getSession(@CurrentUser() u: { id: string }) {
    return this.cards.getSession(u.id);
  }

  @Post()
  create(@CurrentUser() u: { id: string }, @Body() dto: CreateCardDto) {
    return this.cards.create(u.id, dto);
  }

  @Post('bulk-import')
  @HttpCode(HttpStatus.OK)
  bulkImport(@CurrentUser() u: { id: string }, @Body() dto: BulkImportDto) {
    return this.cards.importCsv(u.id, dto.noteId, dto.csv);
  }

  @Patch(':id')
  update(@CurrentUser() u: { id: string }, @Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cards.update(u.id, id, dto);
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  rate(@CurrentUser() u: { id: string }, @Param('id') id: string, @Body() dto: RateCardDto) {
    return this.cards.rate(u.id, id, dto);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  suspend(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.cards.setSuspended(u.id, id, true);
  }

  @Post(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  unsuspend(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.cards.setSuspended(u.id, id, false);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.cards.delete(u.id, id);
  }
}

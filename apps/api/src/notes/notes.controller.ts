import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseInterceptors, UploadedFiles, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { memoryStorage } from 'multer';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('notes')
export class NotesController {
  constructor(private notes: NotesService) {}

  @Get()
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @CurrentUser() u: { id: string },
    @Query('domain') domain?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notes.list(u.id, {
      domain, status, search, sort,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('domains')
  domains(@CurrentUser() u: { id: string }) {
    return this.notes.domains(u.id);
  }

  @Get(':id')
  findById(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.notes.findById(u.id, id);
  }

  @Get(':id/links')
  links(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.notes.links(u.id, id);
  }

  @Get(':id/cards')
  cards(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.notes.cardsForNote(u.id, id);
  }

  @Post()
  create(@CurrentUser() u: { id: string }, @Body() dto: CreateNoteDto) {
    return this.notes.create(u.id, dto);
  }

  @Put(':id')
  update(@CurrentUser() u: { id: string }, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notes.update(u.id, id, dto);
  }

  @Patch(':id')
  patch(@CurrentUser() u: { id: string }, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notes.update(u.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.notes.delete(u.id, id);
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 200, { storage: memoryStorage() }))
  import(
    @CurrentUser() u: { id: string },
    @UploadedFiles() files: Express.Multer.File[],
    @Query('domainId') domainId: string,
  ) {
    return this.notes.importMarkdownFiles(u.id, files, domainId);
  }

  @Post(':id/cards/generate')
  @HttpCode(HttpStatus.OK)
  generateCards(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.notes.generateCards(u.id, id);
  }

  @Post(':id/cards')
  addCards(
    @CurrentUser() u: { id: string },
    @Param('id') id: string,
    @Body() body: { cards: any[] },
  ) {
    return this.notes.addGeneratedCards(u.id, id, body.cards);
  }
}

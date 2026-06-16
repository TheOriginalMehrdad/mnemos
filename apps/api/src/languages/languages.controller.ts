import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LanguagesService } from './languages.service';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('languages')
@ApiBearerAuth()
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languages: LanguagesService) {}

  @Get()
  list(@CurrentUser() u: { id: string }) {
    return this.languages.list(u.id);
  }

  @Put(':code')
  update(@CurrentUser() u: { id: string }, @Param('code') code: string, @Body() dto: UpdateLanguageDto) {
    return this.languages.upsert(u.id, code, dto);
  }
}

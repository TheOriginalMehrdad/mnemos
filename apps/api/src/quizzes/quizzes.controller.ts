import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('quizzes')
@ApiBearerAuth()
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzes: QuizzesService) {}

  @Get() list(@CurrentUser() u: { id: string }) { return this.quizzes.list(u.id); }
  @Get(':id') findById(@CurrentUser() u: { id: string }, @Param('id') id: string) { return this.quizzes.findById(u.id, id); }
  @Post('generate') generate(@CurrentUser() u: { id: string }, @Body() dto: GenerateQuizDto) { return this.quizzes.generate(u.id, dto); }
  @Post(':id/submit') @HttpCode(HttpStatus.OK) submit(@CurrentUser() u: { id: string }, @Param('id') id: string, @Body() dto: SubmitQuizDto) { return this.quizzes.submit(u.id, id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) delete(@CurrentUser() u: { id: string }, @Param('id') id: string) { return this.quizzes.delete(u.id, id); }
}

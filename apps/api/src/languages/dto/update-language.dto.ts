import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLanguageDto {
  @ApiProperty({ example: 'B1', description: 'CEFR level (A1–C2)' })
  @IsString()
  cefrLevel: string;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsInt()
  @Min(0)
  vocabSize?: number;
}

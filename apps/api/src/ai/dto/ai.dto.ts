import { IsString, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateCardsDto {
  @ApiProperty()
  @IsString()
  noteId: string;

  @ApiPropertyOptional({ default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  count?: number;
}

export class GenerateQuizDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  questionCount?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  types?: string[];
}

export class SummarizeDto {
  @ApiProperty()
  @IsString()
  noteId: string;
}

export class SearchDto {
  @ApiProperty()
  @IsString()
  query: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mode?: string;
}

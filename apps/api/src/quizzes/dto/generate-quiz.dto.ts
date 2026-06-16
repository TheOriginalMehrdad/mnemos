import { IsString, IsOptional, IsInt, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateQuizDto {
  @ApiPropertyOptional() @IsOptional() @IsString() noteId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() domain?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() topic?: string;
  @ApiProperty({ default: 10 }) @IsInt() @Min(3) @Max(30) questionCount: number;
  @ApiPropertyOptional({ type: [String], default: ['mc', 'tf', 'fill'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  types?: string[];
}

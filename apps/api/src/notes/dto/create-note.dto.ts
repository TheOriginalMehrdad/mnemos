import { IsString, IsOptional, IsArray, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteStatus } from '@prisma/client';

export class CreateNoteDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() domainId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() topic?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional({ enum: NoteStatus }) @IsOptional() @IsEnum(NoteStatus) status?: NoteStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) difficulty?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

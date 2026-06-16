import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CardType } from '@prisma/client';

export class UpdateCardDto {
  @ApiPropertyOptional({ enum: CardType }) @IsOptional() @IsEnum(CardType) type?: CardType;
  @ApiPropertyOptional() @IsOptional() @IsString() topic?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() front?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() back?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() context?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() suspended?: boolean;
}

export class BulkImportDto {
  @ApiPropertyOptional({ description: 'Note to attach imported cards to' })
  @IsString()
  noteId: string;

  @ApiPropertyOptional({ description: 'CSV/TSV content: front,back[,tags] per row (Anki-compatible)' })
  @IsString()
  csv: string;
}

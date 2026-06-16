import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardType } from '@prisma/client';

export class CreateCardDto {
  @ApiProperty() @IsString() noteId: string;
  @ApiProperty() @IsString() domainId: string;
  @ApiPropertyOptional({ enum: CardType }) @IsOptional() @IsEnum(CardType) type?: CardType;
  @ApiPropertyOptional() @IsOptional() @IsString() topic?: string;
  @ApiProperty() @IsString() front: string;
  @ApiProperty() @IsString() back: string;
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
}

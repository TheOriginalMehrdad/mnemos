import { IsOptional, IsString, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(5) @Max(240) dailyGoalMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) dailyNewCards?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() interleaving?: boolean;
  @ApiPropertyOptional({ enum: ['light', 'dark', 'system'] }) @IsOptional() @IsString() theme?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() aiProvider?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() embeddingModel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vaultPath?: string;
}

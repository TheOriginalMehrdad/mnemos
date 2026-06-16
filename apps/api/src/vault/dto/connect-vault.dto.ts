import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectVaultDto {
  @ApiProperty({ example: '/vault', description: 'Absolute path to the Markdown vault folder' })
  @IsString()
  @IsNotEmpty()
  path: string;
}

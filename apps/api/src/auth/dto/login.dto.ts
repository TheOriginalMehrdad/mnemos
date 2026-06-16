import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Admin username (or email) set via ADMIN_USERNAME' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'change-me' })
  @IsString()
  password: string;
}

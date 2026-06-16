import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'mehrdad@vault.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mnemos123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Mehrdad' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;
}

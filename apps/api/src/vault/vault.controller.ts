import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VaultService } from './vault.service';
import { ConnectVaultDto } from './dto/connect-vault.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('vault')
@ApiBearerAuth()
@Controller('vault')
export class VaultController {
  constructor(private readonly vault: VaultService) {}

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  connect(@CurrentUser() u: { id: string }, @Body() dto: ConnectVaultDto) {
    return this.vault.connect(u.id, dto.path);
  }

  @Get('status')
  status(@CurrentUser() u: { id: string }) {
    return this.vault.status(u.id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync(@CurrentUser() u: { id: string }) {
    return this.vault.sync(u.id);
  }
}

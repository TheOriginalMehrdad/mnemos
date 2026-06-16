import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private user: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser() u: { id: string }) {
    return this.user.getProfile(u.id);
  }

  @Put('profile')
  updateProfile(@CurrentUser() u: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.user.updateProfile(u.id, dto);
  }
}

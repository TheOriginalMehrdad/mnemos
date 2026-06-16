import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const SELECT = {
  id: true, email: true, name: true, initials: true,
  vaultPath: true, dailyGoalMin: true, dailyNewCards: true,
  interleaving: true, theme: true, aiProvider: true, embeddingModel: true,
  createdAt: true,
};

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: SELECT });
    return {
      ...user,
      initials: user.initials || user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.name) {
      data['initials'] = dto.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    }
    const user = await this.prisma.user.update({ where: { id: userId }, data, select: SELECT });
    return user;
  }
}

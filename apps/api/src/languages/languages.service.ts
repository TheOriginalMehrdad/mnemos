import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLanguageDto } from './dto/update-language.dto';

/** CEFR language levels (single-user). Backed by the UserLanguage model. */
@Injectable()
export class LanguagesService {
  constructor(private readonly prisma: PrismaService) {}

  /** @returns All tracked languages with grammar axes. */
  async list(userId: string) {
    return this.prisma.userLanguage.findMany({
      where: { userId },
      include: { grammarAxes: true },
      orderBy: { code: 'asc' },
    });
  }

  /** Create or update the CEFR level (and optional vocab size) for a language. */
  async upsert(userId: string, code: string, dto: UpdateLanguageDto) {
    return this.prisma.userLanguage.upsert({
      where: { userId_code: { userId, code } },
      update: { cefr: dto.cefrLevel, ...(dto.vocabSize !== undefined ? { vocab: dto.vocabSize } : {}) },
      create: {
        userId,
        code,
        name: code.toUpperCase(),
        flag: '🏳️',
        cefr: dto.cefrLevel,
        vocab: dto.vocabSize ?? 0,
      },
    });
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type RequestUser = { id: string; email: string; name: string };

/**
 * Local single-user mode: there is no login. Every request is automatically
 * the one seeded user, so all `@CurrentUser()` controllers keep working
 * unchanged. The resolved user is cached after the first lookup.
 */
@Injectable()
export class SingleUserGuard implements CanActivate {
  private cached: RequestUser | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request.user = await this.resolveUser();
    return true;
  }

  private async resolveUser(): Promise<RequestUser | null> {
    if (this.cached) return this.cached;
    const user = await this.prisma.user.findFirst();
    if (!user) return null;
    this.cached = { id: user.id, email: user.email, name: user.name };
    return this.cached;
  }
}

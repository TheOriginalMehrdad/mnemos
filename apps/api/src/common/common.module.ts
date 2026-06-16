import { Global, Module } from '@nestjs/common';
import { SystemUserService } from './system-user.service';

/** Global utilities available to every module. */
@Global()
@Module({
  providers: [SystemUserService],
  exports: [SystemUserService],
})
export class CommonModule {}

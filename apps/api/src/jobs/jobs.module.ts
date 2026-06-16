import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceProcessor } from './processors/maintenance.processor';
import { MaintenanceScheduler } from './maintenance.scheduler';
import { QUEUE_MAINTENANCE } from './job.constants';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_MAINTENANCE })],
  providers: [MaintenanceService, MaintenanceProcessor, MaintenanceScheduler],
  exports: [MaintenanceService],
})
export class JobsModule {}

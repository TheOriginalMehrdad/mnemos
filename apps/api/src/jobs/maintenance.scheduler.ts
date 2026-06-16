import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SystemUserService } from '../common/system-user.service';
import { QUEUE_MAINTENANCE, JOB_LONG_ABSENCE, LongAbsenceJobData } from './job.constants';

/** Registers the repeatable midnight long-absence job on startup. */
@Injectable()
export class MaintenanceScheduler implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceScheduler.name);

  constructor(
    @InjectQueue(QUEUE_MAINTENANCE) private readonly queue: Queue<LongAbsenceJobData>,
    private readonly systemUser: SystemUserService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const userId = await this.systemUser.getUserId();
      await this.queue.add(
        JOB_LONG_ABSENCE,
        { userId },
        { repeat: { pattern: '0 0 * * *' }, jobId: 'long-absence-daily', removeOnComplete: true },
      );
      this.logger.log('Scheduled daily long-absence job (midnight)');
    } catch {
      this.logger.warn('Admin user not ready; long-absence job will schedule on next boot');
    }
  }
}

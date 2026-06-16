import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MaintenanceService } from '../maintenance.service';
import { QUEUE_MAINTENANCE, LongAbsenceJobData } from '../job.constants';

/** Worker: daily maintenance (long-absence resurfacing). */
@Processor(QUEUE_MAINTENANCE)
export class MaintenanceProcessor extends WorkerHost {
  constructor(private readonly maintenance: MaintenanceService) {
    super();
  }

  async process(job: Job<LongAbsenceJobData>): Promise<number> {
    return this.maintenance.runLongAbsence(job.data.userId);
  }
}

/** BullMQ queue and job name constants. */

export const QUEUE_VAULT_INDEX = 'vault-index';
export const QUEUE_CARD_GENERATION = 'card-generation';
export const QUEUE_MAINTENANCE = 'maintenance';

export const JOB_INDEX_VAULT = 'index-vault';
export const JOB_GENERATE_CARDS = 'generate-cards';
export const JOB_LONG_ABSENCE = 'long-absence';

export interface IndexVaultJobData {
  userId: string;
  reason: 'connect' | 'sync' | 'startup';
}

export interface GenerateCardsJobData {
  userId: string;
  noteId: string;
}

export interface LongAbsenceJobData {
  userId: string;
}

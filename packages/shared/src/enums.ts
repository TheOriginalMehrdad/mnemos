/** Shared enums mirroring the Prisma schema, usable by API and frontend. */

export enum NoteStatus {
  Draft = 'draft',
  ReviewReady = 'review_ready',
  Mastered = 'mastered',
}

export enum CardType {
  Basic = 'basic',
  Cloze = 'cloze',
  Reverse = 'reverse',
  Code = 'code',
  Translation = 'translation',
  Definition = 'definition',
}

export enum LinkType {
  Wikilink = 'wikilink',
  Tag = 'tag',
  Semantic = 'semantic',
  LearningPath = 'learning_path',
}

/** Why a card surfaced in the adaptive review queue. */
export enum QueueReason {
  Overdue = 'overdue',
  New = 'new',
  MistakeRecent = 'mistake_recent',
  LongAbsence = 'long_absence',
  Scheduled = 'scheduled',
}

/** Vault indexing phases reported over WebSocket. */
export enum VaultPhase {
  Scanning = 'scanning',
  Indexing = 'indexing',
  Linking = 'linking',
  Cards = 'cards',
  Done = 'done',
}

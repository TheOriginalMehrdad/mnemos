/**
 * Provider-agnostic AI surface. The stub implementation returns deterministic
 * mock data today; a real Ollama/OpenAI provider can implement this same
 * interface and be swapped in via the AI_PROVIDER token without touching
 * controllers or the card-generation pipeline.
 */

export const AI_PROVIDER = 'AI_PROVIDER';

export interface NoteLike {
  id: string;
  title: string;
  content: string;
  domain?: string;
}

export interface GeneratedCard {
  type: 'basic' | 'cloze' | 'definition';
  front: string;
  back: string;
}

export interface GeneratedQuizQuestion {
  type: 'mc' | 'tf' | 'fill' | 'short';
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface AiResult<T> {
  data: T;
  source: 'stub' | 'openai' | 'ollama';
}

export interface AIProvider {
  /** Generate `count` flashcards from a note. */
  generateCards(note: NoteLike, count?: number): Promise<AiResult<GeneratedCard[]>>;
  /** Generate `count` quiz questions from note/domain content. */
  generateQuiz(notes: NoteLike[], count: number, types: string[]): Promise<AiResult<GeneratedQuizQuestion[]>>;
  /** Summarize a note. */
  summarize(note: NoteLike): Promise<AiResult<string>>;
  /** Keyword/semantic search across notes. */
  search(query: string, notes: NoteLike[]): Promise<AiResult<NoteLike[]>>;
  /** A templated connection between two notes from different domains. */
  dailyInsight(a: NoteLike, b: NoteLike): Promise<AiResult<string>>;
}

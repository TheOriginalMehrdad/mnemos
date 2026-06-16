import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildCardGenPrompt } from './prompts/card-gen.prompt';
import { buildQuizGenPrompt } from './prompts/quiz-gen.prompt';
import { buildInsightPrompt } from './prompts/insight.prompt';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeneratedCard {
  type: string;
  front: string;
  back: string;
}

export interface GeneratedQuestion {
  type: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

@Injectable()
export class ChatAiService {
  private readonly logger = new Logger(ChatAiService.name);
  private readonly mock: boolean;
  private readonly apiKey: string;
  private readonly chatModel: string;

  constructor(private config: ConfigService) {
    this.mock = config.get<boolean>('openai.mock') ?? true;
    this.apiKey = config.get<string>('openai.apiKey') ?? '';
    this.chatModel = config.get<string>('openai.chatModel') ?? 'gpt-4o-mini';
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    if (this.mock || !this.apiKey) {
      return this.mockComplete(messages);
    }
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: this.apiKey });
      const res = await client.chat.completions.create({
        model: this.chatModel,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });
      return res.choices[0]?.message?.content ?? '';
    } catch (err) {
      this.logger.warn('OpenAI chat failed, using mock', err);
      return this.mockComplete(messages);
    }
  }

  async generateCards(
    noteTitle: string,
    noteContent: string,
    count: number,
  ): Promise<GeneratedCard[]> {
    if (this.mock || !this.apiKey) {
      return this.mockCards(noteTitle, count);
    }
    try {
      const prompt = buildCardGenPrompt(noteTitle, noteContent, count);
      const text = await this.complete([{ role: 'user', content: prompt }]);
      const parsed = JSON.parse(text.trim());
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.mockCards(noteTitle, count);
    }
  }

  async generateQuiz(
    noteContent: string,
    questionCount: number,
    types: string[],
  ): Promise<GeneratedQuestion[]> {
    if (this.mock || !this.apiKey) {
      return this.mockQuestions(questionCount);
    }
    try {
      const prompt = buildQuizGenPrompt(noteContent, questionCount, types);
      const text = await this.complete([{ role: 'user', content: prompt }]);
      const parsed = JSON.parse(text.trim());
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.mockQuestions(questionCount);
    }
  }

  async generateInsight(
    titleA: string, contentA: string, domainA: string,
    titleB: string, contentB: string, domainB: string,
  ): Promise<string> {
    if (this.mock || !this.apiKey) {
      return `Your note on **${titleA}** (${domainA}) and **${titleB}** (${domainB}) share a structural parallel that goes beyond their surface differences. Examining both reveals that the underlying mechanisms operate on remarkably similar principles of emergent organization.`;
    }
    try {
      const prompt = buildInsightPrompt(titleA, contentA, domainA, titleB, contentB, domainB);
      return await this.complete([{ role: 'user', content: prompt }]);
    } catch {
      return `Your notes on **${titleA}** and **${titleB}** share a surprising conceptual parallel worth exploring.`;
    }
  }

  private mockComplete(messages: ChatMessage[]): string {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const systemMsg = messages.find((m) => m.role === 'system');
    const hasContext = systemMsg?.content.includes('## ');
    const noteMatch = systemMsg?.content.match(/## (.+)\n/);
    const noteTitle = noteMatch ? noteMatch[1] : 'your notes';

    if (!lastUser) return 'I can help you explore your knowledge vault.';

    const query = lastUser.content.toLowerCase();
    if (hasContext) {
      return `Based on [From your notes: ${noteTitle}], here is what I found:\n\nThe concept you're asking about relates to the core ideas in your vault. Your notes cover this topic from multiple angles — reviewing the source note will give you the full picture.\n\nWould you like me to generate some flashcards on this topic?`;
    }
    return `Your vault doesn't contain notes on "${query}" yet. Would you like me to give a general explanation, or help you create a note on this topic?`;
  }

  private mockCards(noteTitle: string, count: number): GeneratedCard[] {
    const base: GeneratedCard[] = [
      { type: 'basic', front: `What is the main concept in ${noteTitle}?`, back: `The main concept involves understanding the core principles and their practical applications in context.` },
      { type: 'cloze', front: `${noteTitle} is primarily used to {{blank}} in modern systems.`, back: `${noteTitle} is primarily used to solve complex problems efficiently in modern systems.` },
      { type: 'definition', front: `Define: ${noteTitle}`, back: `${noteTitle} is a concept that describes a systematic approach to organizing and processing information.` },
      { type: 'basic', front: `Why is ${noteTitle} important?`, back: `It provides a structured framework for solving problems that would otherwise require more complex solutions.` },
      { type: 'basic', front: `What are the key components of ${noteTitle}?`, back: `The key components include the core algorithm, the data structures used, and the optimization strategies applied.` },
      { type: 'cloze', front: `The main advantage of ${noteTitle} over alternatives is {{blank}}.`, back: `The main advantage of ${noteTitle} over alternatives is its efficiency and predictability.` },
    ];
    return base.slice(0, Math.min(count, base.length));
  }

  private mockQuestions(count: number): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [
      { type: 'mc', prompt: 'Which of the following best describes the primary purpose of spaced repetition?', options: ['To review material at increasing intervals', 'To memorize as fast as possible', 'To test comprehension once', 'To avoid forgetting by constant review'], answer: 'To review material at increasing intervals', explanation: 'Spaced repetition leverages the spacing effect to strengthen long-term memory.' },
      { type: 'tf', prompt: 'The FSRS algorithm uses three core parameters: stability, difficulty, and retrievability.', options: ['True', 'False'], answer: 'True', explanation: 'FSRS models memory with exactly these three quantities.' },
      { type: 'fill', prompt: 'In FSRS, the parameter that measures how long a memory will persist is called _____.', options: [], answer: 'stability', explanation: 'Stability (S) represents the number of days before forgetting reaches 10%.' },
      { type: 'short', prompt: 'Explain in your own words why interleaving improves long-term retention.', options: [], answer: 'Interleaving forces the brain to retrieve and re-contextualize material repeatedly, strengthening retrieval pathways.', explanation: 'Research shows interleaving improves retention by 43% vs. blocked practice (Kornell & Bjork, 2008).' },
    ];
    return questions.slice(0, Math.min(count, questions.length));
  }
}

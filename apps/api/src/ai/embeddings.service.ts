import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly mock: boolean;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private config: ConfigService) {
    this.mock = config.get<boolean>('openai.mock') ?? true;
    this.apiKey = config.get<string>('openai.apiKey') ?? '';
    this.model = config.get<string>('openai.embeddingModel') ?? 'text-embedding-3-small';
  }

  async embed(text: string): Promise<number[]> {
    if (this.mock || !this.apiKey) {
      return this.mockEmbedding(text);
    }
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: this.apiKey });
      const res = await client.embeddings.create({
        model: this.model,
        input: text.slice(0, 8191),
      });
      return res.data[0].embedding;
    } catch (err) {
      this.logger.warn('OpenAI embedding failed, using mock', err);
      return this.mockEmbedding(text);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (this.mock || !this.apiKey) {
      return texts.map((t) => this.mockEmbedding(t));
    }
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: this.apiKey });
      const batches: number[][] = [];
      for (let i = 0; i < texts.length; i += 100) {
        const slice = texts.slice(i, i + 100).map((t) => t.slice(0, 8191));
        const res = await client.embeddings.create({ model: this.model, input: slice });
        batches.push(...res.data.map((d) => d.embedding));
      }
      return batches;
    } catch (err) {
      this.logger.warn('OpenAI batch embedding failed, using mock');
      return texts.map((t) => this.mockEmbedding(t));
    }
  }

  mockEmbedding(text: string): number[] {
    const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 1536 }, (_, i) =>
      Math.sin(seed * (i + 1) * 0.0314) * 0.5 + Math.cos(seed * i * 0.0271) * 0.3,
    );
  }
}

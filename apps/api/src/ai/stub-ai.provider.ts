import { Injectable } from '@nestjs/common';
import {
  AIProvider,
  AiResult,
  GeneratedCard,
  GeneratedQuizQuestion,
  NoteLike,
} from './ai-provider.interface';

/**
 * Deterministic, offline stub AI provider. Produces realistically-shaped mock
 * responses so the whole pipeline (card generation, quizzes, search, insights)
 * works end-to-end with no external service. Every response is tagged source:'stub'.
 */
@Injectable()
export class StubAiProvider implements AIProvider {
  async generateCards(note: NoteLike, count = 4): Promise<AiResult<GeneratedCard[]>> {
    const paragraphs = this.paragraphs(note.content);
    const firstParagraph = paragraphs[0] ?? note.title;
    const sentences = this.sentences(note.content);

    const cards: GeneratedCard[] = [
      { type: 'basic', front: `What is ${note.title}?`, back: firstParagraph },
    ];

    if (sentences[0]) {
      cards.push({
        type: 'basic',
        front: `Summarize "${note.title}" in one sentence.`,
        back: sentences[0],
      });
    }
    if (paragraphs[1]) {
      cards.push({
        type: 'definition',
        front: `Explain a key idea from "${note.title}".`,
        back: paragraphs[1],
      });
    }
    const cloze = this.makeCloze(sentences[1] ?? sentences[0] ?? firstParagraph);
    if (cloze) cards.push({ type: 'cloze', front: cloze.front, back: cloze.back });

    cards.push({
      type: 'basic',
      front: `Why does "${note.title}" matter?`,
      back: firstParagraph,
    });

    const clamped = Math.min(Math.max(count, 3), 5);
    return { data: cards.slice(0, clamped), source: 'stub' };
  }

  async generateQuiz(
    notes: NoteLike[],
    count: number,
    types: string[],
  ): Promise<AiResult<GeneratedQuizQuestion[]>> {
    const allowed = types.length ? types : ['mc', 'tf', 'fill'];
    const questions: GeneratedQuizQuestion[] = [];
    for (let i = 0; i < count; i++) {
      const note = notes[i % Math.max(notes.length, 1)] ?? { title: 'a concept', content: '' };
      const type = allowed[i % allowed.length] as GeneratedQuizQuestion['type'];
      questions.push(this.mockQuestion(type, note, notes));
    }
    return { data: questions, source: 'stub' };
  }

  async summarize(note: NoteLike): Promise<AiResult<string>> {
    const summary = this.sentences(note.content).slice(0, 3).join(' ').trim() || note.title;
    return { data: summary, source: 'stub' };
  }

  async search(query: string, notes: NoteLike[]): Promise<AiResult<NoteLike[]>> {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = notes.filter((n) => {
      const haystack = `${n.title} ${n.content}`.toLowerCase();
      return words.some((w) => haystack.includes(w));
    });
    return { data: matches, source: 'stub' };
  }

  async dailyInsight(a: NoteLike, b: NoteLike): Promise<AiResult<string>> {
    const text =
      `Both "${a.title}" (${a.domain ?? 'one domain'}) and "${b.title}" (${b.domain ?? 'another domain'}) ` +
      `share an underlying pattern: ideas you practice in one area quietly reinforce the other. ` +
      `Revisit them together to strengthen the connection.`;
    return { data: text, source: 'stub' };
  }

  // ─── helpers ──────────────────────────────────────────────────────────────

  private paragraphs(content: string): string[] {
    return content
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.length > 0 && !p.startsWith('#'));
  }

  private sentences(content: string): string[] {
    const flat = content.replace(/[#*`>_]/g, '').replace(/\s+/g, ' ').trim();
    return flat
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private makeCloze(sentence: string): { front: string; back: string } | null {
    const words = sentence.split(' ').filter((w) => w.length > 4);
    if (words.length === 0) return null;
    const target = words[Math.floor(words.length / 2)];
    return { front: sentence.replace(target, '{{...}}'), back: target };
  }

  private mockQuestion(
    type: GeneratedQuizQuestion['type'],
    note: NoteLike,
    notes: NoteLike[],
  ): GeneratedQuizQuestion {
    const correct = note.title;
    const distractors = notes
      .map((n) => n.title)
      .filter((t) => t !== correct)
      .slice(0, 3);
    while (distractors.length < 3) distractors.push(`Not ${correct} (${distractors.length + 1})`);

    if (type === 'tf') {
      return {
        type,
        prompt: `True or False: "${correct}" is a topic in your vault.`,
        options: ['True', 'False'],
        answer: 'True',
        explanation: `"${correct}" exists as a note, so the statement is true.`,
      };
    }
    if (type === 'fill') {
      return {
        type,
        prompt: `Fill in the blank: The note titled "____" covers this concept.`,
        options: [],
        answer: correct,
        explanation: `The relevant note is "${correct}".`,
      };
    }
    if (type === 'short') {
      return {
        type,
        prompt: `In one sentence, what is "${correct}" about?`,
        options: [],
        answer: this.sentences(note.content)[0] ?? correct,
        explanation: 'Any answer capturing the core idea is acceptable.',
      };
    }
    const options = this.shuffle([correct, ...distractors]);
    return {
      type: 'mc',
      prompt: `Which of these is "${correct}"?`,
      options,
      answer: correct,
      explanation: `"${correct}" is the matching concept.`,
    };
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

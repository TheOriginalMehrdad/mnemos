import { Injectable } from '@nestjs/common';
import matter from 'gray-matter';

export interface ParsedNote {
  title: string;
  content: string;
  rawContent: string;
  tags: string[];
  status: string;
  difficulty: number;
  language: string;
  source: string;
  excerpt: string;
  wordCount: number;
  readMinutes: number;
  wikilinks: string[];
  frontmatter: Record<string, unknown>;
}

@Injectable()
export class VaultParserService {
  parseMarkdown(rawContent: string, filename?: string): ParsedNote {
    const { data: fm, content } = matter(rawContent);

    const title = (fm['title'] as string) || this.titleFromFilename(filename ?? '') || 'Untitled';
    const tags = this.normalizeTags(fm['tags']);
    const status = this.normalizeStatus(fm['status'] as string);
    const difficulty = Math.min(5, Math.max(1, parseInt(String(fm['difficulty'] ?? '3'), 10)));
    const language = (fm['language'] as string) || 'en';
    const source = (fm['source'] as string) || '';

    const strippedContent = this.stripMarkdown(content);
    const words = strippedContent.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const excerpt = this.extractExcerpt(content);
    const wikilinks = this.extractWikilinks(content);

    return {
      title,
      content: content.trim(),
      rawContent,
      tags,
      status,
      difficulty,
      language,
      source,
      excerpt,
      wordCount,
      readMinutes,
      wikilinks,
      frontmatter: fm,
    };
  }

  private titleFromFilename(filename: string): string {
    return filename.replace(/\.md$/, '').replace(/[-_]/g, ' ');
  }

  private normalizeTags(raw: unknown): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'string') return raw.split(',').map((t) => t.trim()).filter(Boolean);
    return [];
  }

  private normalizeStatus(raw: string): string {
    const map: Record<string, string> = {
      'review-ready': 'review_ready',
      'review_ready': 'review_ready',
      'mastered': 'mastered',
      'draft': 'draft',
    };
    return map[raw] ?? 'draft';
  }

  private stripMarkdown(content: string): string {
    return content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[>\-*+]/g, '')
      .trim();
  }

  extractExcerpt(content: string, maxLen = 200): string {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---') && trimmed.length > 20) {
        const clean = trimmed
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/\[\[([^\]]+)\]\]/g, '$1');
        return clean.length > maxLen ? clean.slice(0, maxLen - 3) + '...' : clean;
      }
    }
    return '';
  }

  extractWikilinks(content: string): string[] {
    const matches = content.matchAll(/\[\[([^\]|#]+?)(?:[|#][^\]]+)?\]\]/g);
    const links: string[] = [];
    for (const m of matches) {
      links.push(m[1].trim());
    }
    return [...new Set(links)];
  }

  slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);
  }
}

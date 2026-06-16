import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { VaultIndexerService } from './vault-indexer.service';
import { VaultParserService } from '../notes/vault-parser.service';
import { JOB_GENERATE_CARDS } from '../jobs/job.constants';

/**
 * Integration test for the vault indexer over a real temp directory, using an
 * in-memory Prisma fake so the test runs with no database. Exercises the real
 * parser + link-resolution + card-enqueue pipeline.
 */
describe('VaultIndexerService (integration)', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eruditio-vault-'));
    await fs.mkdir(path.join(tmpDir, 'Software Engineering'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, 'Software Engineering', 'Visitor Pattern.md'),
      '---\ntitle: Visitor Pattern\ntags: [patterns]\n---\n\nThe visitor pattern separates an algorithm from an object structure. See [[Double Dispatch]].\n',
    );
    await fs.writeFile(
      path.join(tmpDir, 'Software Engineering', 'Double Dispatch.md'),
      '---\ntitle: Double Dispatch\n---\n\nDouble dispatch selects a method based on the runtime types of two objects.\n',
    );
    await fs.writeFile(
      path.join(tmpDir, 'Inbox.md'),
      '---\ntitle: Inbox\n---\n\nA scratch note with no links.\n',
    );
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('indexes notes, resolves a wikilink and enqueues card generation for new notes', async () => {
    // Arrange — in-memory Prisma fake
    const notesById = new Map<string, any>();
    const notesBySlug = new Map<string, any>();
    const links: any[] = [];
    let seq = 0;

    const prisma: any = {
      note: {
        findUnique: async ({ where }: any) => notesBySlug.get(where.userId_slug.slug) ?? null,
        create: async ({ data }: any) => {
          const rec = { id: `note-${++seq}`, ...data };
          notesBySlug.set(data.slug, rec);
          notesById.set(rec.id, rec);
          return rec;
        },
        update: async ({ where, data }: any) => {
          const rec = notesById.get(where.id);
          Object.assign(rec, data);
          return rec;
        },
        findFirst: async ({ where }: any) => {
          const title = where.OR?.[0]?.title?.equals?.toLowerCase();
          const slug = where.OR?.[1]?.slug;
          for (const rec of notesById.values()) {
            if (rec.title.toLowerCase() === title || rec.slug === slug) return rec;
          }
          return null;
        },
      },
      domain: {
        upsert: async ({ where, create }: any) => ({ id: create.id, key: where.userId_key.key }),
      },
      noteLink: {
        deleteMany: async () => ({ count: 0 }),
        upsert: async ({ create }: any) => {
          links.push(create);
          return create;
        },
      },
      vault: { upsert: async () => ({}) },
    };

    const gateway: any = { emit: jest.fn() };
    const queue: any = { add: jest.fn().mockResolvedValue(undefined) };
    const indexer = new VaultIndexerService(prisma, new VaultParserService(), gateway, queue);

    // Act
    const result = await indexer.indexVault('user-1', tmpDir);

    // Assert
    expect(result.indexed).toBe(3);
    expect(result.failed).toBe(0);
    expect(notesBySlug.size).toBe(3);

    // The Visitor Pattern note links to Double Dispatch
    expect(links).toHaveLength(1);
    const visitor = notesBySlug.get('software-engineering-visitor-pattern');
    const doubleDispatch = notesBySlug.get('software-engineering-double-dispatch');
    expect(visitor).toBeDefined();
    expect(doubleDispatch).toBeDefined();
    expect(links[0].fromId).toBe(visitor.id);
    expect(links[0].toId).toBe(doubleDispatch.id);

    // Card generation enqueued for each new note
    expect(queue.add).toHaveBeenCalledTimes(3);
    expect(queue.add).toHaveBeenCalledWith(
      JOB_GENERATE_CARDS,
      expect.objectContaining({ userId: 'user-1' }),
      expect.any(Object),
    );
  });
});

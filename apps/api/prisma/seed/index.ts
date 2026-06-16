import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Idempotent seed: ensures a single admin user exists, derived from the
 * ADMIN_USERNAME / ADMIN_PASSWORD environment variables. Safe to run repeatedly.
 */
const prisma = new PrismaClient();

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';
}

async function main(): Promise<void> {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'change-me';
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  const email = username.includes('@') ? username : `${username}@eruditio.local`;
  const vaultPath = process.env.VAULT_PATH ?? '/vault';

  const passwordHash = await bcrypt.hash(password, rounds);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: username, vaultPath },
    create: {
      email,
      passwordHash,
      name: username,
      initials: initialsOf(username),
      vaultPath,
    },
  });

  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`✔ Seeded admin user "${username}" (${email})`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

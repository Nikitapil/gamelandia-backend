import { PrismaClient } from '@prisma/client';
import { seedGames } from './seeds/GameSeed';

const prisma = new PrismaClient();

const main = async () => {
  await seedGames(prisma);
};

main().then(() => console.info('[SEED] Succussfully create games records'));

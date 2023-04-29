import { PrismaClient } from '@prisma/client';
import { createInitialScores } from './utils';

export const seedGames = async (prisma: PrismaClient) => {
  const games = [
    {
      name: 'numbers',
      scores: {
        create: createInitialScores(10)
      }
    },
    {
      name: 'snake',
      scores: {
        create: createInitialScores(10, 'easy')
          .concat(createInitialScores(10, 'medium'))
          .concat(createInitialScores(10, 'hard'))
      }
    },
    {
      name: 'battleship'
    },
    {
      name: 'chess'
    },
    {
      name: 'tetris',
      scores: {
        create: createInitialScores(10)
      }
    },
    {
      name: 'solitaire'
    },
    {
      name: 'clone_invaders',
      scores: {
        create: createInitialScores(10)
      }
    },
    {
      name: 'flappy',
      scores: {
        create: createInitialScores(10)
      }
    },
    {
      name: 'aim',
      scores: {
        create: createInitialScores(10)
      }
    },
    {
      name: 'match'
    },
    {
      name: 'tic_tac_toe'
    },
    {
      name: 'dyno',
      scores: {
        create: createInitialScores(1)
      }
    }
  ];
  await Promise.all(
    games.map(async (game) => {
      const test = await prisma.game.upsert({
        where: { name: game.name },
        update: {},
        create: {
          name: game.name,
          scores: game.scores
        }
      });
      console.log(test);
    })
  );
};

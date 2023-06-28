import { FavoritesQuizesOnUser, Quiz } from '@prisma/client';

export interface IGeneratedQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export type TAllQuizesItem = Quiz & {
  favouritedBy: FavoritesQuizesOnUser[];
  _count: { questions: number };
  User?: { username: string };
};

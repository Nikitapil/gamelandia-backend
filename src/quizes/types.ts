import { FavoritesQuizesOnUser, Quiz, QuizQuestion } from '@prisma/client';

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

export type TQuizWithQuestions = Quiz & { questions: QuizQuestion[] };

export interface IPlayQuestion {
  id: string;
  question: string;
  answers: string[];
}

export interface ICategoryResponse {
  trivia_categories: {
    id: number;
    name: string;
  }[];
}

import { FavoritesQuizesOnUser, Quiz, Prisma } from '@prisma/client';
import { GetAllQuizesDto } from './dto/get-all-quizes.dto';

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

export type TQuizWhereInput = Prisma.QuizWhereInput;

export interface IGetQuizesParams {
  dto: GetAllQuizesDto;
  userId: number;
  where: TQuizWhereInput;
}

export type TRatingResponseFromDb = (Prisma.PickArray<
  Prisma.QuizRatingGroupByOutputType,
  'quizId'[]
> & { _avg: { rating: number } })[];

export interface ICategoryQuestionResponse {
  category_id: number;
  category_question_count: CategoryQuestionCount;
}

export interface CategoryQuestionCount {
  total_question_count: number;
  total_easy_question_count: number;
  total_medium_question_count: number;
  total_hard_question_count: number;
}

export enum EQuizDifficulties {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export const QuizDifficulties = [
  EQuizDifficulties.EASY,
  EQuizDifficulties.MEDIUM,
  EQuizDifficulties.HARD
] as const;

export enum EQuizQuestionType {
  MULTIPLE = 'multiple',
  BOOL = 'boolean'
}

export const QuizQuestionTypes = [
  EQuizQuestionType.MULTIPLE,
  EQuizQuestionType.BOOL
] as const;

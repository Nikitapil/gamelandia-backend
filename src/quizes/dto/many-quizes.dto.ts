import { TAllQuizesItem } from '../types';

export class ManyQuizesDto {
  constructor(quiz: TAllQuizesItem) {
    this.id = quiz.id;
    this.createdAt = quiz.createdAt;
    this.updatedAt = quiz.updatedAt;
    this.name = quiz.name;
    this.isPrivate = quiz.isPrivate;
    this.userId = quiz.userId;
    this.isInFavourites = !!quiz.favouritedBy.length;
    this.questionsCount = quiz._count.questions;
    this.author = quiz.User?.username || null;
  }

  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  isPrivate: boolean;
  userId: number | null;
  isInFavourites: boolean;
  questionsCount: number;
  author: string | null;
}

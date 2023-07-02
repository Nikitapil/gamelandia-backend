import { TAllQuizesItem, TRatingResponseFromDb } from '../types';

export class ManyQuizesDto {
  constructor(quiz: TAllQuizesItem, ratings: TRatingResponseFromDb) {
    this.id = quiz.id;
    this.createdAt = quiz.createdAt;
    this.updatedAt = quiz.updatedAt;
    this.name = quiz.name;
    this.isPrivate = quiz.isPrivate;
    this.userId = quiz.userId;
    this.isInFavourites = !!quiz.favouritedBy.length;
    this.questionsCount = quiz._count.questions;
    this.author = quiz.User?.username || null;
    this.getRating(ratings);
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
  rating: number | null;

  private getRating(ratings: TRatingResponseFromDb) {
    const rating = ratings.find((rate) => rate.quizId === this.id);
    this.rating = rating?._avg?.rating || null;
  }
}

import { TAllQuizesItem, TRatingResponseFromDb } from '../types';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'quiz id', type: String })
  id: string;

  @ApiProperty({ description: 'created date', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'updated date', type: Date })
  updatedAt: Date;

  @ApiProperty({ description: 'quiz name', type: String })
  name: string;

  @ApiProperty({ description: 'quiz privacy', type: Boolean })
  isPrivate: boolean;

  @ApiProperty({ description: 'created date', type: Number, nullable: true })
  userId: number | null;

  @ApiProperty({ description: 'is quiz in users favourites', type: Boolean })
  isInFavourites: boolean;

  @ApiProperty({ description: 'count of quiz questions', type: Number })
  questionsCount: number;

  @ApiProperty({ description: 'author', type: String, nullable: true })
  author: string | null;

  @ApiProperty({ description: 'quiz rating', type: Number, nullable: true })
  rating: number | null;

  private getRating(ratings: TRatingResponseFromDb) {
    const rating = ratings.find((rate) => rate.quizId === this.id);
    this.rating = rating?._avg?.rating || null;
  }
}

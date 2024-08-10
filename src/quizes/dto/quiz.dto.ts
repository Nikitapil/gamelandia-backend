import { TAllQuizesItem, TRatingResponseFromDb } from '../types';
import { ApiProperty } from '@nestjs/swagger';

interface QuizDtoParams {
  quiz: TAllQuizesItem;
  ratings: TRatingResponseFromDb;
  currentUserId: number;
}

export class QuizDto {
  @ApiProperty({ description: 'quiz id', type: String })
  id: string;

  @ApiProperty({ description: 'created date', type: String })
  createdAt: Date;

  @ApiProperty({ description: 'updated date', type: String })
  updatedAt: Date;

  @ApiProperty({ description: 'quiz name', type: String })
  name: string;

  @ApiProperty({ description: 'quiz privacy', type: Boolean })
  isPrivate: boolean;

  @ApiProperty({ description: 'created date', type: Number, nullable: true })
  userId: number | null;

  @ApiProperty({ description: 'is quiz in users favourites', type: Boolean })
  isInFavourites: boolean;

  @ApiProperty({ description: 'Ability to edit quiz', type: Boolean })
  canEdit: boolean;

  @ApiProperty({ description: 'count of quiz questions', type: Number })
  questionsCount: number;

  @ApiProperty({ description: 'author', type: String, nullable: true })
  author: string | null;

  @ApiProperty({ description: 'quiz rating', type: Number, nullable: true })
  rating: number | null;

  constructor({ quiz, ratings, currentUserId }: QuizDtoParams) {
    const isUserIdsEquals = currentUserId === quiz.userId;

    this.id = quiz.id;
    this.createdAt = quiz.createdAt;
    this.updatedAt = quiz.updatedAt;
    this.name = quiz.name;
    this.isPrivate = quiz.isPrivate;
    this.userId = quiz.userId;
    this.isInFavourites = !!quiz.favouritedBy.length;
    this.questionsCount = quiz._count.questions;
    this.author = quiz.User?.username || null;
    this.canEdit = isUserIdsEquals;
    this.getRating(ratings);
  }

  private getRating(ratings: TRatingResponseFromDb) {
    const rating = ratings.find((rate) => rate.quizId === this.id);
    this.rating = rating?._avg?.rating || null;
  }
}

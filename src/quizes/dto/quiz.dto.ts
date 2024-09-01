import { TAllQuizesItem, TRatingResponseFromDb } from '../types';
import { ApiProperty } from '@nestjs/swagger';
import { UserReturnDto } from '../../auth/dto/user-return.dto';
import { QuizActions } from './security/quiz-actions';

interface QuizDtoParams {
  quiz: TAllQuizesItem;
  ratings: TRatingResponseFromDb;
  currentUser: UserReturnDto | undefined;
}

export class QuizDto extends QuizActions {
  @ApiProperty({ description: 'quiz id', type: String })
  id: string;

  @ApiProperty({ description: 'created date', type: String })
  createdAt: Date;

  @ApiProperty({ description: 'updated date', type: String, nullable: true })
  updatedAt: Date | null;

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

  @ApiProperty({ description: 'count of quiz comments', type: Number })
  commentsCount: number;

  @ApiProperty({ description: 'author', type: String, nullable: true })
  author: string | null;

  @ApiProperty({ description: 'quiz rating', type: Number, nullable: true })
  rating: number | null;

  constructor({ quiz, ratings, currentUser }: QuizDtoParams) {
    super({ quiz, user: currentUser });

    this.id = quiz.id;
    this.createdAt = quiz.createdAt;
    this.updatedAt = quiz.updatedAt;
    this.name = quiz.name;
    this.isPrivate = quiz.isPrivate;
    this.userId = quiz.userId;
    this.isInFavourites = !!quiz.favouritedBy.length;
    this.questionsCount = quiz._count.questions;
    this.commentsCount = quiz._count.comments;
    this.author = quiz.User?.username || null;
    this.getRating(ratings);
  }

  private getRating(ratings: TRatingResponseFromDb) {
    const rating = ratings.find((rate) => rate.quizId === this.id);
    this.rating = rating?._avg?.rating || null;
  }
}

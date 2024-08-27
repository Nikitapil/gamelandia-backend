import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizQuestionReturnDto } from './quiz-question-return.dto';
import { Quiz, QuizQuestion } from '@prisma/client';
import { QuizActions } from './security/quiz-actions';
import { UserReturnDto } from '../../auth/dto/user-return.dto';

interface ISingleQuizReturnDtoParams {
  quiz: Quiz & { questions: QuizQuestion[] };
  rating: number | null;
  isInFavourites: boolean;
  currentUser: UserReturnDto | undefined;
}

export class SingleQuizReturnDto extends QuizActions {
  @ApiPropertyOptional({
    description: 'quiz rating',
    type: Number,
    nullable: true
  })
  rating?: number | null;

  @ApiProperty({ description: 'quiz id', type: String })
  id: string;

  @ApiProperty({ description: 'quiz created date', type: String })
  createdAt: Date;

  @ApiProperty({
    description: 'quiz updated date',
    type: String,
    nullable: true
  })
  updatedAt: Date | null;

  @ApiProperty({ description: 'quiz name', type: String })
  name: string;

  @ApiProperty({ description: 'quiz created date', type: Boolean })
  isPrivate: boolean;

  @ApiProperty({ description: 'quiz author id', type: Number, nullable: true })
  userId: number | null;

  @ApiProperty({ description: 'quiz questions', type: [QuizQuestionReturnDto] })
  questions: QuizQuestionReturnDto[];

  @ApiProperty({
    description: 'is Quiz in favourites by current user',
    type: Boolean
  })
  isInFavourites: boolean;

  @ApiProperty({
    description: 'is Quiz in favourites by current user',
    type: Boolean
  })
  isGenerated: boolean;

  constructor({
    rating,
    quiz,
    isInFavourites,
    currentUser
  }: ISingleQuizReturnDtoParams) {
    super({ quiz, user: currentUser });
    this.rating = rating;
    this.isInFavourites = isInFavourites;

    this.id = quiz.id;
    this.createdAt = quiz.createdAt;
    this.updatedAt = quiz.updatedAt;
    this.name = quiz.name;
    this.isPrivate = quiz.isPrivate;
    this.userId = quiz.userId;
    this.questions = quiz.questions;
    this.isGenerated = quiz.isGenerated;
  }
}

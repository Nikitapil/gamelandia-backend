import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizQuestionReturnDto } from './quiz-question-return.dto';

export class SingleQuizReturnDto {
  @ApiPropertyOptional({ description: 'quiz rating', type: Number })
  rating?: number;

  @ApiProperty({ description: 'quiz id', type: String })
  id: string;

  @ApiProperty({ description: 'quiz created date', type: String })
  createdAt: Date;

  @ApiProperty({ description: 'quiz updated date', type: String })
  updatedAt: Date;

  @ApiProperty({ description: 'quiz name', type: String })
  name: string;

  @ApiProperty({ description: 'quiz created date', type: Boolean })
  isPrivate: boolean;

  @ApiProperty({ description: 'quiz author id', type: Number })
  userId: number;

  @ApiProperty({ description: 'quiz questions', type: [QuizQuestionReturnDto] })
  questions: QuizQuestionReturnDto[];

  @ApiProperty({
    description: 'is Quiz in favourites by current user',
    type: Boolean
  })
  isInFavourites: boolean;
}

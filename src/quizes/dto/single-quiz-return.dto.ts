import { ApiProperty } from '@nestjs/swagger';
import { QuizQuestionReturnDto } from './quiz-question-return.dto';

export class SingleQuizReturnDto {
  @ApiProperty({ description: 'quiz rating', type: Number })
  rating?: number;

  @ApiProperty({ description: 'quiz id', type: String })
  id: string;

  @ApiProperty({ description: 'quiz created date', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'quiz updated date', type: Date })
  updatedAt: Date;

  @ApiProperty({ description: 'quiz name', type: String })
  name: string;

  @ApiProperty({ description: 'quiz created date', type: Boolean })
  isPrivate: boolean;

  @ApiProperty({ description: 'quiz author id', type: Number })
  userId: number;

  @ApiProperty({ description: 'quiz questions', type: [QuizQuestionReturnDto] })
  questions: QuizQuestionReturnDto[];
}

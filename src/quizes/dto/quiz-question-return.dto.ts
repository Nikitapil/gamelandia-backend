import { ApiProperty } from '@nestjs/swagger';

export class QuizQuestionReturnDto {
  @ApiProperty({ description: 'question id', type: String })
  id: string;

  @ApiProperty({ description: 'question created at', type: String })
  createdAt: Date;

  @ApiProperty({
    description: 'question updated at',
    type: String,
    nullable: true
  })
  updatedAt: Date | null;

  @ApiProperty({ description: 'question', type: String })
  question: string;

  @ApiProperty({ description: 'question correct answer', type: String })
  correctAnswer: string;

  @ApiProperty({ description: 'question incorrect answers', type: [String] })
  incorrectAnswers: string[];

  @ApiProperty({ description: 'quiz id', type: String })
  quizId: string;
}

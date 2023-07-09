import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuizQuestionDto {
  @ApiProperty({ description: 'question', type: String })
  @IsString({ message: 'Question must be a string value' })
  question: string;

  @ApiProperty({ description: 'correct answer', type: String })
  @IsString({ message: 'Correct answer should be a string value' })
  correctAnswer: string;

  @ApiProperty({ description: 'incorrect answers', type: [String] })
  @IsArray({ message: 'Incorrect answers should be an array value' })
  incorrectAnswers: string[];
}

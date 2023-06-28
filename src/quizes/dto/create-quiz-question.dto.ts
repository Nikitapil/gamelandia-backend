import { IsArray, IsString } from 'class-validator';

export class CreateQuizQuestionDto {
  @IsString({ message: 'Question must be a string value' })
  question: string;

  @IsString({ message: 'Correct answer should be a string value' })
  correctAnswer: string;

  @IsArray({ message: 'Incorrect answers should be an array value' })
  incorrectAnswers: string[];
}

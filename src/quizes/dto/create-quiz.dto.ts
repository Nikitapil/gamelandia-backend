import { IsArray, IsBoolean, IsString } from 'class-validator';
import { CreateQuizQuestionDto } from './create-quiz-question.dto';

export class CreateQuizDto {
  @IsString({ message: 'Quiz name should be string' })
  name: string;

  @IsBoolean({ message: 'isPrivate field should be true or false' })
  isPrivate: boolean;

  @IsArray({ message: 'Questions should be an array' })
  questions: CreateQuizQuestionDto[];
}

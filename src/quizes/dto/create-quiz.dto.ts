import { IsArray, IsBoolean, IsString } from 'class-validator';
import { CreateQuizQuestionDto } from './create-quiz-question.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuizDto {
  @ApiProperty({ description: 'Quiz name', type: String })
  @IsString({ message: 'Quiz name should be string' })
  name: string;

  @ApiProperty({ description: 'Quiz privacy', type: String })
  @IsBoolean({ message: 'isPrivate field should be true or false' })
  isPrivate: boolean;

  @ApiProperty({ description: 'Quiz questions', type: [CreateQuizQuestionDto] })
  @IsArray({ message: 'Questions should be an array' })
  questions: CreateQuizQuestionDto[];
}

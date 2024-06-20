import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EQuizDifficulties,
  EQuizQuestionType,
  QuizDifficulties,
  QuizQuestionTypes
} from '../types';

export class GenerateQuizDto {
  @ApiProperty({ description: 'amount of questions', type: Number })
  @IsNumber({}, { message: 'amount must be a number value' })
  amount: number;

  @ApiPropertyOptional({ description: 'category of questions', type: Number })
  @IsNumber({}, { message: 'amount must be a number value' })
  @IsOptional()
  category?: number;

  @ApiPropertyOptional({
    description: 'difficulty of questions',
    type: String,
    enum: EQuizDifficulties,
    enumName: 'QuizDifficultiesEnum'
  })
  @IsString({ message: 'difficulty must be string' })
  @IsOptional()
  @IsEnum(QuizDifficulties)
  difficulty?: EQuizDifficulties;

  @ApiPropertyOptional({
    description: 'type of questions',
    type: String,
    enum: EQuizQuestionType,
    enumName: 'QuizQuestionTypeEnum'
  })
  @IsString({ message: 'difficulty must be string' })
  @IsOptional()
  @IsEnum(QuizQuestionTypes)
  type?: EQuizQuestionType;
}

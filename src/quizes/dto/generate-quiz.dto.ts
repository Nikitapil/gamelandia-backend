import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateQuizDto {
  @ApiProperty({ description: 'amount of questions', type: Number })
  @IsNumber({}, { message: 'amount must be a number value' })
  amount: number;

  @ApiProperty({ description: 'category of questions', type: Number })
  @IsNumber({}, { message: 'amount must be a number value' })
  @IsOptional()
  category?: number;

  @ApiProperty({
    description: 'difficulty of questions',
    type: String,
    enum: ['easy', 'medium', 'hard']
  })
  @IsString({ message: 'difficulty must be string' })
  @IsOptional()
  difficulty?: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    description: 'type of questions',
    type: String,
    enum: ['multiple', 'boolean']
  })
  @IsString({ message: 'difficulty must be string' })
  @IsOptional()
  type?: 'multiple' | 'boolean';
}

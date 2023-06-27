import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GenerateQuizDto {
  @IsNumber({}, { message: 'amount must be a number value' })
  amount: number;

  @IsNumber({}, { message: 'amount must be a number value' })
  @IsOptional()
  category?: number;

  @IsString({ message: 'difficulty must be string' })
  @IsOptional()
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsString({ message: 'difficulty must be string' })
  @IsOptional()
  type?: 'multiple' | 'boolean';
}

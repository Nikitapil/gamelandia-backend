import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateScoreDto {
  @IsString({ message: 'gameName should be string' })
  gameName: string;

  @IsNumber({}, { message: 'Score value should be number' })
  value: number;

  @IsString({ message: 'Game level should be string' })
  @IsOptional()
  level?: string;
}

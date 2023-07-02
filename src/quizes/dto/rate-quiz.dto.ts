import { IsNumber, IsString, Max, Min } from 'class-validator';

export class RateQuizDto {
  @IsString()
  quizId: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 },
    { message: 'Rating must be a number value' }
  )
  @Min(1, { message: 'Rating min value is 1' })
  @Max(5, { message: 'Rating min value is 5' })
  rating: number;
}

import { IsNumber, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RateQuizDto {
  @ApiProperty({ description: 'quizId', type: String })
  @IsString()
  quizId: string;

  @ApiProperty({ description: 'rating', type: Number })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 },
    { message: 'Rating must be a number value' }
  )
  @Min(1, { message: 'Rating min value is 1' })
  @Max(5, { message: 'Rating max value is 5' })
  rating: number;
}

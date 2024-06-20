import { QuizDto } from './quiz.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AllQuizesReturnDto {
  @ApiProperty({ description: 'quizes array', type: [QuizDto] })
  quizes: QuizDto[];

  @ApiProperty({ description: 'quizes total count', type: Number })
  totalCount: number;
}

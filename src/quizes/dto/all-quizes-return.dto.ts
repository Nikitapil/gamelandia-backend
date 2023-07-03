import { ManyQuizesDto } from './many-quizes.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AllQuizesReturnDto {
  @ApiProperty({ description: 'quizes array', type: [ManyQuizesDto] })
  quizes: ManyQuizesDto[];

  @ApiProperty({ description: 'quizes total count', type: Number })
  totalCount: number;
}

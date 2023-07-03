import { ApiProperty } from '@nestjs/swagger';

export class CategoryCountReturnDto {
  @ApiProperty({ description: 'Total questions count', type: Number })
  total_question_count: number;

  @ApiProperty({ description: 'easy questions count', type: Number })
  total_easy_question_count: number;

  @ApiProperty({ description: 'medium questions count', type: Number })
  total_medium_question_count: number;

  @ApiProperty({ description: 'hard questions count', type: Number })
  total_hard_question_count: number;
}

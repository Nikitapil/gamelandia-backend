import { ApiProperty } from '@nestjs/swagger';

export class QuizCategoriesReturnDto {
  @ApiProperty({ description: 'category id', type: Number })
  id: number;

  @ApiProperty({ description: 'category name', type: String })
  name: string;
}

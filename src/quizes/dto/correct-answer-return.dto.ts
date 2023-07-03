import { ApiProperty } from '@nestjs/swagger';

export class CorrectAnswerReturnDto {
  @ApiProperty({ description: 'answer', type: String })
  answer: string;
}

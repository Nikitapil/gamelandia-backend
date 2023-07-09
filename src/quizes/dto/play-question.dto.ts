import { ApiProperty } from '@nestjs/swagger';

export class PlayQuestionDto {
  @ApiProperty({ description: 'question id', type: String })
  id: string;

  @ApiProperty({ description: 'question', type: String })
  question: string;

  @ApiProperty({ description: 'question answers', type: [String] })
  answers: string[];
}

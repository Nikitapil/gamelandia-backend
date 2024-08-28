import { QuizCommentReturnDto } from './QuizCommentReturnDto';
import { ApiProperty } from '@nestjs/swagger';

export class ManyCommentsReturnDto {
  @ApiProperty({ description: 'comments list', type: [QuizCommentReturnDto] })
  comments: QuizCommentReturnDto[];

  @ApiProperty({ description: 'total comments count', type: Number })
  totalCount: number;
}

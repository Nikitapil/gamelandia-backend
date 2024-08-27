import { PaginationDto } from '../../shared/dto/PaginationDto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetQuizCommentsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'parent id', type: String })
  replyToId?: string;

  @ApiProperty({ description: 'quiz id', type: String })
  quizId?: string;
}

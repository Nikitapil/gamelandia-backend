import { PaginationDto } from '../../shared/dto/PaginationDto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetQuizCommentsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'parent id', type: String })
  @IsOptional()
  @IsString()
  replyToId?: string;

  @ApiProperty({ description: 'quiz id', type: String })
  @IsString()
  quizId?: string;
}

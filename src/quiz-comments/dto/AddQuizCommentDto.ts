import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddQuizCommentDto {
  @ApiProperty({ description: 'comment text', type: String })
  @IsString({ message: 'text should be a string' })
  @IsNotEmpty({ message: 'text should not be empty' })
  text: string;

  @ApiPropertyOptional({ description: 'parent comment id', type: String })
  @IsString()
  @IsOptional()
  replyToId?: string;

  @ApiProperty({ description: 'quizId', type: String })
  @IsString({ message: 'quizId should be a string' })
  @IsNotEmpty({ message: 'quizId should not be empty' })
  quizId: string;
}

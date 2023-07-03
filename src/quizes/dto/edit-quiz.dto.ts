import { CreateQuizDto } from './create-quiz.dto';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditQuizDto extends CreateQuizDto {
  @ApiProperty({ description: 'quiz id', type: String })
  @IsString({ message: 'Quiz id must be a string value' })
  id: string;
}

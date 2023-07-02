import { CreateQuizDto } from './create-quiz.dto';
import { IsString } from 'class-validator';

export class EditQuizDto extends CreateQuizDto {
  @IsString({ message: 'Quiz id must be a string value' })
  id: string;
}

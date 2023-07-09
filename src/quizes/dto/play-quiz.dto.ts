import { TQuizWithQuestions } from '../types';
import { mapQuestionsToPlayQuestions } from '../helpers/quiz-mappers';
import { ApiProperty } from '@nestjs/swagger';
import { PlayQuestionDto } from './play-question.dto';

export class PlayQuizDto {
  @ApiProperty({ description: 'quiz id', type: String })
  id: string;

  @ApiProperty({ description: 'quiz name', type: String })
  name: string;

  @ApiProperty({ description: 'quiz privacy', type: Boolean })
  isPrivate: boolean;

  @ApiProperty({ description: 'quiz questions', type: [PlayQuestionDto] })
  questions: PlayQuestionDto[];

  constructor(quiz: TQuizWithQuestions) {
    this.id = quiz.id;
    this.isPrivate = quiz.isPrivate;
    this.name = quiz.name;
    this.questions = mapQuestionsToPlayQuestions(quiz.questions);
  }
}

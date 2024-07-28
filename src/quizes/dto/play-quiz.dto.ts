import { mapQuestionsToPlayQuestions } from '../helpers/quiz-mappers';
import { ApiProperty } from '@nestjs/swagger';
import { PlayQuestionDto } from './play-question.dto';
import { SingleQuizReturnDto } from './single-quiz-return.dto';

export class PlayQuizDto {
  @ApiProperty({ description: 'quiz id', type: String })
  id: string;

  @ApiProperty({ description: 'quiz name', type: String })
  name: string;

  @ApiProperty({ description: 'quiz privacy', type: Boolean })
  isPrivate: boolean;

  @ApiProperty({
    description: 'is Quiz generated or created by user',
    type: Boolean
  })
  isGenerated: boolean;

  @ApiProperty({ description: 'quiz questions', type: [PlayQuestionDto] })
  questions: PlayQuestionDto[];

  @ApiProperty({
    description: 'is Quiz in favourites by current user',
    type: Boolean
  })
  isInFavourites: boolean;

  constructor(quiz: SingleQuizReturnDto) {
    this.id = quiz.id;
    this.isPrivate = quiz.isPrivate;
    this.name = quiz.name;
    this.questions = mapQuestionsToPlayQuestions(quiz.questions);
    this.isInFavourites = quiz.isInFavourites;
    this.isGenerated = quiz.isGenerated;
  }
}

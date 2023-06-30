import { IPlayQuestion, TQuizWithQuestions } from '../types';
import { mapQuestionsToPlayQuestions } from '../helpers/quiz-mappers';

export class PlayQuizDto {
  id: string;
  name: string;
  isPrivate: boolean;
  questions: IPlayQuestion[];

  constructor(quiz: TQuizWithQuestions) {
    this.id = quiz.id;
    this.isPrivate = quiz.isPrivate;
    this.name = quiz.name;
    this.questions = mapQuestionsToPlayQuestions(quiz.questions);
  }
}

import { CreateQuizQuestionDto } from '../dto/create-quiz-question.dto';
import { BadRequestException } from '@nestjs/common';

export const validateQuizQuestions = (questions: CreateQuizQuestionDto[]) => {
  if (questions.length < 3) {
    throw new BadRequestException('min_quiz_questions_length_error');
  }
  if (questions.some((q) => !q.incorrectAnswers?.length || !q.correctAnswer)) {
    throw new BadRequestException('min_quiz_questions_incorrect_answers_error');
  }
};

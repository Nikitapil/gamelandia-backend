import { CreateQuizQuestionDto } from '../dto/create-quiz-question.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Quiz } from '@prisma/client';
import { TUserRole } from '../../types';

export const validateQuizQuestions = (questions: CreateQuizQuestionDto[]) => {
  if (questions.length < 3) {
    throw new BadRequestException('min_quiz_questions_length_error');
  }
  if (questions.some((q) => !q.incorrectAnswers?.length || !q.correctAnswer)) {
    throw new BadRequestException('min_quiz_questions_incorrect_answers_error');
  }
};

export const validateQuizForUser = (
  userId: number,
  quiz?: Quiz | null,
  role?: TUserRole
) => {
  if (!quiz) {
    throw new NotFoundException('quiz_not_found');
  }

  if (quiz.userId !== userId && role !== 'Admin') {
    throw new BadRequestException('access_denied');
  }
};

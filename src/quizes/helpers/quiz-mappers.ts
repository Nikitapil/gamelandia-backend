import { IGeneratedQuestion } from '../types';
import { QuizQuestion } from '@prisma/client';
import { shuffleArray } from '../../shared/helpers/arrays.helpers';
import { PlayQuestionDto } from '../dto/play-question.dto';

export const mapGeneratedQuestions = (questions: IGeneratedQuestion[]) => {
  return questions.map((question) => ({
    correctAnswer: question.correct_answer,
    incorrectAnswers: question.incorrect_answers,
    question: question.question
  }));
};

export const mapQuestionsToPlayQuestions = (
  questions: QuizQuestion[]
): PlayQuestionDto[] => {
  return questions.map((question) => ({
    id: question.id,
    question: question.question,
    answers: shuffleArray([
      ...question.incorrectAnswers,
      question.correctAnswer
    ])
  }));
};

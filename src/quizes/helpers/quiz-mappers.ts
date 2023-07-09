import { IGeneratedQuestion, IPlayQuestion } from '../types';
import { QuizQuestion } from '@prisma/client';
import { shuffleArray } from '../../helpers/arrays.helpers';

export const mapGeneratedQuestions = (questions: IGeneratedQuestion[]) => {
  return questions.map((question) => ({
    correctAnswer: question.correct_answer,
    incorrectAnswers: question.incorrect_answers,
    question: question.question
  }));
};

export const mapQuestionsToPlayQuestions = (
  questions: QuizQuestion[]
): IPlayQuestion[] => {
  return questions.map((question) => ({
    id: question.id,
    question: question.question,
    answers: shuffleArray([
      ...question.incorrectAnswers,
      question.correctAnswer
    ])
  }));
};

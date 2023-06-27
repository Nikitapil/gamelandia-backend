import { IGeneratedQuestion } from '../types';

export const mapGeneratedQuestions = (questions: IGeneratedQuestion[]) => {
  return questions.map((question) => ({
    correctAnswer: question.correct_answer,
    incorrectAnswers: question.incorrect_answers,
    question: question.question
  }));
};

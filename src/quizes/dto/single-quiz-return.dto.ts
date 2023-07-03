import { QuizQuestion } from '@prisma/client';

export class SingleQuizReturnDto {
  rating: number;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  isPrivate: boolean;
  userId: number;
  questions: QuizQuestion[];
}

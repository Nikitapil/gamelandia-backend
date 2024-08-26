import { AddQuizCommentDto } from './dto/AddQuizCommentDto';
import { UserReturnDto } from '../auth/dto/user-return.dto';
import { QuizComment } from '@prisma/client';

export interface AddQuizCommentsParams {
  user: UserReturnDto;
  dto: AddQuizCommentDto;
}

export type QuizCommentFromDb = QuizComment & {
  user?: {
    username: string;
  };
  _count?: {
    replies?: number;
  };
};

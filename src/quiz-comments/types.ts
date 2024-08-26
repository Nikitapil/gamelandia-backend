import { AddQuizCommentDto } from './dto/AddQuizCommentDto';
import { UserReturnDto } from '../auth/dto/user-return.dto';
import { QuizComment } from '@prisma/client';
import { EditQuizCommentDto } from './dto/EditQuizCommentDto';

export interface AddQuizCommentsParams {
  user: UserReturnDto;
  dto: AddQuizCommentDto;
}

export interface EditQuizCommentsParams {
  user: UserReturnDto;
  dto: EditQuizCommentDto;
}

export interface DeleteQuizCommentsParams {
  user: UserReturnDto;
  id: string;
}

export type QuizCommentFromDb = QuizComment & {
  user?: {
    username: string;
  };
  _count?: {
    replies?: number;
  };
};

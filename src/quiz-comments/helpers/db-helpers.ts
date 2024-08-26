import { Prisma } from '.prisma/client';

export const commentInclude: Prisma.QuizCommentInclude = {
  user: {
    select: {
      username: true
    }
  },
  _count: {
    select: {
      replies: true
    }
  }
};

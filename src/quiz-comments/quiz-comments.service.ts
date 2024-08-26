import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddQuizCommentsParams } from './types';
import { commentInclude } from './helpers/db-helpers';
import { QuizCommentReturnDto } from './dto/QuizCommentReturnDto';

@Injectable()
export class QuizCommentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async addQuizComment({
    user,
    dto
  }: AddQuizCommentsParams): Promise<QuizCommentReturnDto> {
    const quiz = await this.prismaService.quiz.findUnique({
      where: { id: dto.quizId }
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with id ${dto.quizId} not found`);
    }

    const newComment = await this.prismaService.quizComment.create({
      data: {
        text: dto.text,
        quizId: dto.quizId,
        userId: user.id,
        replyToId: dto.replayToId
      },
      include: commentInclude
    });

    return new QuizCommentReturnDto({ quizCommentFromDb: newComment, user });
  }
}

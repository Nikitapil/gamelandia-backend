import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddQuizCommentsParams,
  DeleteQuizCommentsParams,
  EditQuizCommentsParams,
  GetQuizCommentsParams
} from './types';
import { commentInclude } from './helpers/db-helpers';
import { QuizCommentReturnDto } from './dto/QuizCommentReturnDto';
import { SuccessMessageDto } from '../dto/success-message.dto';
import { Prisma } from '.prisma/client';
import { calculateOffset } from '../shared/helpers/calculations';

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
        replyToId: dto.replyToId
      },
      include: commentInclude
    });

    return new QuizCommentReturnDto({ quizCommentFromDb: newComment, user });
  }

  async editQuizComment({ user, dto }: EditQuizCommentsParams) {
    const comment = await this.prismaService.quizComment.findUnique({
      where: { id: dto.id },
      include: commentInclude
    });

    if (!comment) {
      throw new NotFoundException(`Comment with not found`);
    }

    const { canEdit } = new QuizCommentReturnDto({
      quizCommentFromDb: comment,
      user
    });

    if (!canEdit) {
      throw new ForbiddenException('Edit comment not allowed');
    }

    const updatedQuiz = await this.prismaService.quizComment.update({
      where: { id: dto.id },
      data: {
        text: dto.text
      },
      include: commentInclude
    });

    return new QuizCommentReturnDto({ quizCommentFromDb: updatedQuiz, user });
  }

  async deleteQuizComment({ id, user }: DeleteQuizCommentsParams) {
    const comment = await this.prismaService.quizComment.findUnique({
      where: { id },
      include: commentInclude
    });

    if (!comment) {
      throw new NotFoundException(`Comment not found`);
    }

    const { canDelete } = new QuizCommentReturnDto({
      quizCommentFromDb: comment,
      user
    });

    if (!canDelete) {
      throw new ForbiddenException('Delete comment not allowed');
    }

    await this.prismaService.quizComment.delete({
      where: { id }
    });

    return new SuccessMessageDto();
  }

  async getComments({ dto, user }: GetQuizCommentsParams) {
    const where: Prisma.QuizCommentWhereInput = {
      quizId: dto.quizId,
      replyToId: dto.replyToId ?? null
    };

    const offset = calculateOffset(dto);

    const comments = await this.prismaService.quizComment.findMany({
      where,
      take: dto.limit,
      skip: offset,
      include: commentInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalCount = await this.prismaService.quizComment.count({ where });

    return {
      comments: comments.map(
        (comment) =>
          new QuizCommentReturnDto({ quizCommentFromDb: comment, user })
      ),
      totalCount
    };
  }
}

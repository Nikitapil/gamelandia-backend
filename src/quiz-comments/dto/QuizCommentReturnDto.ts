import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizCommentFromDb } from '../types';
import { UserReturnDto } from '../../auth/dto/user-return.dto';

interface IQuizCommentReturnDtoParams {
  quizCommentFromDb: QuizCommentFromDb;
  user?: UserReturnDto;
}

export class QuizCommentReturnDto {
  @ApiProperty({ description: 'comment id', type: String })
  id: string;

  @ApiProperty({ description: 'comment created date', type: String })
  createdAt: Date;

  @ApiProperty({
    description: 'comment updated date',
    type: String,
    nullable: true
  })
  updatedAt: Date | null;

  @ApiProperty({ description: 'comment text', type: String })
  text: string;

  @ApiProperty({ description: 'comment  quiz id', type: String })
  quizId: string;

  @ApiProperty({ description: 'comment  quiz id', type: Number })
  authorId: number;

  @ApiPropertyOptional({
    description: 'parent comment id',
    type: String,
    nullable: true
  })
  replyToId?: string | null;

  @ApiProperty({ description: 'comment  author name', type: String })
  authorName: string;

  @ApiProperty({ description: 'comment replies count', type: String })
  repliesCount: number;

  @ApiProperty({ description: 'can edit comment', type: Boolean })
  canEdit: boolean;

  @ApiProperty({ description: 'can delete comment', type: Boolean })
  canDelete: boolean;

  constructor({ quizCommentFromDb, user }: IQuizCommentReturnDtoParams) {
    const isCurrentUserAdmin = user?.role === 'Admin';
    const isUserIdsEquals = user?.id === quizCommentFromDb.userId;

    this.id = quizCommentFromDb.id;
    this.createdAt = quizCommentFromDb.createdAt;
    this.updatedAt = quizCommentFromDb.updatedAt;
    this.text = quizCommentFromDb.text;
    this.quizId = quizCommentFromDb.quizId;
    this.authorId = quizCommentFromDb.userId;
    this.replyToId = quizCommentFromDb.replyToId || null;
    this.authorName = quizCommentFromDb.user.username;
    this.repliesCount = quizCommentFromDb._count.replies || 0;

    this.canEdit = isUserIdsEquals;
    this.canDelete = isUserIdsEquals || isCurrentUserAdmin;
  }
}

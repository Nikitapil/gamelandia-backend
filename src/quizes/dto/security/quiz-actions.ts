import { ApiProperty } from '@nestjs/swagger';
import { UserReturnDto } from '../../../auth/dto/user-return.dto';

interface QuizActionsParams {
  quiz: { userId?: number | null };
  user: UserReturnDto | undefined;
}

export class QuizActions {
  @ApiProperty({ description: 'Ability to edit quiz', type: Boolean })
  canEdit: boolean;

  @ApiProperty({ description: 'Ability to delete quiz', type: Boolean })
  canDelete: boolean;

  constructor({ quiz, user }: QuizActionsParams) {
    const isUserIdsEquals = user?.id === quiz.userId;

    this.canEdit = isUserIdsEquals;
    this.canDelete = isUserIdsEquals || user?.role === 'Admin';
  }
}

import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import { QuizCommentsService } from './quiz-comments.service';
import { AddQuizCommentDto } from './dto/AddQuizCommentDto';
import { User } from '../decorators/User.decorator';
import { UserReturnDto } from '../auth/dto/user-return.dto';
import { QuizCommentReturnDto } from './dto/QuizCommentReturnDto';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EditQuizCommentDto } from './dto/EditQuizCommentDto';
import { SuccessMessageDto } from '../dto/success-message.dto';

@Controller('quiz-comments')
export class QuizCommentsController {
  constructor(private readonly quizCommentsService: QuizCommentsService) {}

  @ApiOperation({
    summary: 'Add comment quiz',
    operationId: 'createQuizComment'
  })
  @ApiResponse({ status: 200, type: QuizCommentReturnDto })
  @UseGuards(JwtGuard)
  @Post()
  createQuizComment(
    @Body() dto: AddQuizCommentDto,
    @User() user: UserReturnDto
  ): Promise<QuizCommentReturnDto> {
    return this.quizCommentsService.addQuizComment({ dto, user });
  }

  @ApiOperation({
    summary: 'Edit comment quiz',
    operationId: 'editQuizComment'
  })
  @ApiResponse({ status: 200, type: QuizCommentReturnDto })
  @UseGuards(JwtGuard)
  @Put()
  editQuizComment(
    @Body() dto: EditQuizCommentDto,
    @User() user: UserReturnDto
  ): Promise<QuizCommentReturnDto> {
    return this.quizCommentsService.editQuizComment({ dto, user });
  }

  @ApiOperation({
    summary: 'Delete comment quiz',
    operationId: 'deleteQuizComment'
  })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Delete(':id')
  deleteQuizComment(
    @Param('id') quizId: string,
    @User() user: UserReturnDto
  ): Promise<SuccessMessageDto> {
    return this.quizCommentsService.deleteQuizComment({ id: quizId, user });
  }
}

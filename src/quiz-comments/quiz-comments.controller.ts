import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { QuizCommentsService } from './quiz-comments.service';
import { AddQuizCommentDto } from './dto/AddQuizCommentDto';
import { User } from '../decorators/User.decorator';
import { UserReturnDto } from '../auth/dto/user-return.dto';
import { QuizCommentReturnDto } from './dto/QuizCommentReturnDto';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AllQuizesReturnDto } from '../quizes/dto/all-quizes-return.dto';

@Controller('quiz-comments')
export class QuizCommentsController {
  constructor(private readonly quizCommentsService: QuizCommentsService) {}

  @ApiOperation({
    summary: 'Add comment quiz',
    operationId: 'createQuizComment'
  })
  @ApiResponse({ status: 200, type: AllQuizesReturnDto })
  @UseGuards(JwtGuard)
  @Post()
  createQuizComment(
    @Body() dto: AddQuizCommentDto,
    @User() user: UserReturnDto
  ): Promise<QuizCommentReturnDto> {
    return this.quizCommentsService.addQuizComment({ dto, user });
  }
}

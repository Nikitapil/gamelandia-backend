import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import { QuizesService } from './quizes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { GetAllQuizesDto } from './dto/get-all-quizes.dto';
import { ApplyUserGuard } from '../guards/auth/apply-user.guard';
import { User } from '../decorators/User.decorator';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { EditQuizDto } from './dto/edit-quiz.dto';
import { RateQuizDto } from './dto/rate-quiz.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReturnGeneratedQuizDto } from './dto/return-generated-quiz.dto';
import { SuccessMessageDto } from '../dto/success-message.dto';
import { AllQuizesReturnDto } from './dto/all-quizes-return.dto';
import { SingleQuizReturnDto } from './dto/single-quiz-return.dto';
import { PlayQuizDto } from './dto/play-quiz.dto';
import { CorrectAnswerReturnDto } from './dto/correct-answer-return.dto';
import { QuizCategoriesReturnDto } from './dto/quiz-categories-return.dto';
import { CategoryCountReturnDto } from './dto/category-count-return.dto';
import { TUserRole } from '../types';

@ApiTags('Quizes')
@Controller('quizes')
export class QuizesController {
  constructor(private quizesService: QuizesService) {}

  @ApiOperation({
    summary: 'generate quiz from opentdb',
    operationId: 'generateQuiz'
  })
  @ApiResponse({ status: 201, type: ReturnGeneratedQuizDto })
  @Post('/generate')
  generateQuiz(@Body() dto: GenerateQuizDto): Promise<ReturnGeneratedQuizDto> {
    return this.quizesService.generateQuiz(dto);
  }

  @ApiOperation({
    summary: 'create new quiz by user',
    operationId: 'createQuiz'
  })
  @ApiResponse({ status: 201, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Post('/create')
  createQuiz(
    @Body() dto: CreateQuizDto,
    @User('id') userId: number
  ): Promise<SuccessMessageDto> {
    return this.quizesService.createQuiz(dto, userId);
  }

  @ApiOperation({
    summary: 'Get all available quizes',
    operationId: 'getAllQuizes'
  })
  @ApiResponse({ status: 200, type: AllQuizesReturnDto })
  @HttpCode(200)
  @UseGuards(ApplyUserGuard)
  @Post('/all')
  getAllQuizes(
    @Body() dto: GetAllQuizesDto,
    @User('id') userId?: number,
    @User('role') userRole?: TUserRole
  ): Promise<AllQuizesReturnDto> {
    return this.quizesService.getAllQuizes(dto, userId, userRole);
  }

  @ApiOperation({ summary: 'Get single quiz', operationId: 'getQuiz' })
  @ApiResponse({ status: 200, type: SingleQuizReturnDto })
  @UseGuards(JwtGuard)
  @Get('/quiz/:id')
  getQuiz(@Param('id') quizId: string): Promise<SingleQuizReturnDto> {
    return this.quizesService.getQuiz(quizId);
  }

  @ApiOperation({ summary: 'Get quiz for play', operationId: 'getPlayQuiz' })
  @ApiResponse({ status: 200, type: PlayQuizDto })
  @UseGuards(ApplyUserGuard)
  @Get('/play/:id')
  getPlayQuiz(
    @Param('id') quizId: string,
    @User('id') userId?: number
  ): Promise<PlayQuizDto> {
    return this.quizesService.getPlayQuiz(quizId, userId);
  }

  @ApiOperation({
    summary: 'Get correct answer for question',
    operationId: 'getCorrectAnswer'
  })
  @ApiResponse({ status: 200, type: CorrectAnswerReturnDto })
  @Get('/question/:id')
  getCorrectAnswer(
    @Param('id') questionId: string
  ): Promise<CorrectAnswerReturnDto> {
    return this.quizesService.getCorrectAnswer(questionId);
  }

  @ApiOperation({
    summary: 'Get available quiz categories',
    operationId: 'getCategories'
  })
  @ApiResponse({ status: 200, type: [QuizCategoriesReturnDto] })
  @Get('/categories')
  getCategories(): Promise<QuizCategoriesReturnDto[]> {
    return this.quizesService.getCategories();
  }

  @ApiOperation({
    summary: 'Get category questions count',
    operationId: 'getCategoriesQuestionCount'
  })
  @ApiResponse({ status: 200, type: CategoryCountReturnDto })
  @Get('/categories/count/:id')
  getCategoriesQuestionCount(
    @Param('id') categoryId: string
  ): Promise<CategoryCountReturnDto> {
    return this.quizesService.getCategoryQuestionsCount(categoryId);
  }

  @ApiOperation({ summary: 'Get user quizes', operationId: 'getQuizesByUser' })
  @ApiResponse({ status: 200, type: AllQuizesReturnDto })
  @HttpCode(200)
  @UseGuards(ApplyUserGuard)
  @Post('/user/:id')
  getQuizesByUser(
    @Body() dto: GetAllQuizesDto,
    @Param('id', ParseIntPipe) userId: number,
    @User('id') currentUserId?: number,
    @User('role') userRole?: TUserRole
  ): Promise<AllQuizesReturnDto> {
    return this.quizesService.getUserQuizes(
      dto,
      userId,
      currentUserId,
      userRole
    );
  }

  @ApiOperation({ summary: 'delete quiz', operationId: 'deleteQuiz' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Delete('/quiz/:id')
  deleteQuiz(
    @Param('id') quizId: string,
    @User('id') userId: number,
    @User('role') userRole?: TUserRole
  ): Promise<SuccessMessageDto> {
    return this.quizesService.deleteQuiz(quizId, userId, userRole);
  }

  @ApiOperation({ summary: 'edit quiz', operationId: 'editQuiz' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Put('/edit')
  editQuiz(
    @Body() dto: EditQuizDto,
    @User('id') userId: number
  ): Promise<SuccessMessageDto> {
    return this.quizesService.editQuiz(dto, userId);
  }

  @ApiOperation({ summary: 'rate quiz', operationId: 'rateQuiz' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Post('/rate')
  rateQuiz(
    @Body() dto: RateQuizDto,
    @User('id') userId: number
  ): Promise<SuccessMessageDto> {
    return this.quizesService.rateQuiz(dto, userId);
  }

  @ApiOperation({
    summary: 'Get all quizes from favourites',
    operationId: 'getFavouritesQuizes'
  })
  @ApiResponse({ status: 200, type: AllQuizesReturnDto })
  @UseGuards(JwtGuard)
  @Post('/favourite')
  getFavouritesQuizes(
    @Body() dto: GetAllQuizesDto,
    @User('id') userId: number
  ): Promise<AllQuizesReturnDto> {
    return this.quizesService.getFavouritesQuizes(dto, userId);
  }

  @ApiOperation({
    summary: 'Add quiz to favourites',
    operationId: 'addQuizToFavourites'
  })
  @ApiResponse({ status: 201, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Post('/favourite/:id')
  addQuizToFavourites(
    @Param('id') quizId: string,
    @User('id') userId: number
  ): Promise<SuccessMessageDto> {
    return this.quizesService.addQuizToFavourites(quizId, userId);
  }

  @ApiOperation({
    summary: 'Remove quiz from favourites',
    operationId: 'removeQuizFromFavourites'
  })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Delete('/favourite/:id')
  removeQuizFromFavourites(
    @Param('id') quizId: string,
    @User('id') userId: number
  ): Promise<SuccessMessageDto> {
    return this.quizesService.removeQuizFromFavourites(quizId, userId);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get, HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards
} from "@nestjs/common";
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

@ApiTags('Quizes')
@Controller('quizes')
export class QuizesController {
  constructor(private quizesService: QuizesService) {}

  @ApiOperation({ summary: 'generate quiz from opentdb' })
  @ApiResponse({ status: 201, type: ReturnGeneratedQuizDto })
  @Post('/generate')
  generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.quizesService.generateQuiz(dto);
  }

  @ApiOperation({ summary: 'create new quiz by user' })
  @ApiResponse({ status: 201, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Post('/create')
  createQuiz(@Body() dto: CreateQuizDto, @User('id') userId: number) {
    return this.quizesService.createQuiz(dto, userId);
  }

  @ApiOperation({ summary: 'Get all available quizes' })
  @ApiResponse({ status: 200, type: AllQuizesReturnDto })
  @HttpCode(200)
  @UseGuards(ApplyUserGuard)
  @Post('/all')
  getAllQuizes(@Body() dto: GetAllQuizesDto, @User('id') userId?: number) {
    return this.quizesService.getAllQuizes(dto, userId);
  }

  @ApiOperation({ summary: 'Get single quiz' })
  @ApiResponse({ status: 200, type: SingleQuizReturnDto })
  @UseGuards(JwtGuard)
  @Get('/quiz/:id')
  getQuiz(@Param('id') quizId: string) {
    return this.quizesService.getQuiz(quizId);
  }

  @ApiOperation({ summary: 'Get quiz for play' })
  @ApiResponse({ status: 200, type: PlayQuizDto })
  @Get('/play/:id')
  getPlayQuiz(@Param('id') quizId: string) {
    return this.quizesService.getPlayQuiz(quizId);
  }

  @ApiOperation({ summary: 'Get correct answer for question' })
  @ApiResponse({ status: 200, type: CorrectAnswerReturnDto })
  @Get('/question/:id')
  getCorrectAnswer(@Param('id') questionId: string) {
    return this.quizesService.getCorrectAnswer(questionId);
  }

  @ApiOperation({ summary: 'Get available quiz categories' })
  @ApiResponse({ status: 200, type: [QuizCategoriesReturnDto] })
  @Get('/categories')
  getCategories() {
    return this.quizesService.getCategories();
  }

  @ApiOperation({ summary: 'Get category questions count' })
  @ApiResponse({ status: 200, type: CategoryCountReturnDto })
  @Get('/categories/count/:id')
  getCategoriesQuestionCount(@Param('id') categoryId: string) {
    return this.quizesService.getCategoryQuestionsCount(categoryId);
  }

  @ApiOperation({ summary: 'Get user quizes' })
  @ApiResponse({ status: 200, type: AllQuizesReturnDto })
  @UseGuards(ApplyUserGuard)
  @Post('/user/:id')
  getQuizesByUser(
    @Body() dto: GetAllQuizesDto,
    @Param('id', ParseIntPipe) userId,
    @User('id') currentUserId?: number
  ) {
    return this.quizesService.getUserQuizes(dto, userId, currentUserId);
  }

  @ApiOperation({ summary: 'delete quiz' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Delete('/quiz/:id')
  deleteQuiz(@Param('id') quizId: string, @User('id') userId: number) {
    return this.quizesService.deleteQuiz(quizId, userId);
  }

  @ApiOperation({ summary: 'edit quiz' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Put('/edit')
  editQuiz(@Body() dto: EditQuizDto, @User('id') userId: number) {
    return this.quizesService.editQuiz(dto, userId);
  }

  @ApiOperation({ summary: 'rate quiz' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Post('/rate')
  rateQuiz(@Body() dto: RateQuizDto, @User('id') userId: number) {
    return this.quizesService.rateQuiz(dto, userId);
  }

  @ApiOperation({ summary: 'Get all quizes from favourites' })
  @ApiResponse({ status: 200, type: AllQuizesReturnDto })
  @UseGuards(JwtGuard)
  @Post('/favourite')
  getFavouritesQuizes(
    @Body() dto: GetAllQuizesDto,
    @User('id') userId: number
  ) {
    return this.quizesService.getFavouritesQuizes(dto, userId);
  }

  @ApiOperation({ summary: 'Add quiz to favourites' })
  @ApiResponse({ status: 201, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Post('/favourite/:id')
  addQuizToFavourites(@Param('id') quizId: string, @User('id') userId: number) {
    return this.quizesService.addQuizToFavourites(quizId, userId);
  }

  @ApiOperation({ summary: 'Remove quiz from favourites' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Delete('/favourite/:id')
  removeQuizFromFavourites(
    @Param('id') quizId: string,
    @User('id') userId: number
  ) {
    return this.quizesService.removeQuizFromFavourites(quizId, userId);
  }
}

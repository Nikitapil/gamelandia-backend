import {
  Body,
  Controller,
  Delete,
  Get,
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

@Controller('quizes')
export class QuizesController {
  constructor(private quizesService: QuizesService) {}

  @Post('/generate')
  generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.quizesService.generateQuiz(dto);
  }

  @UseGuards(JwtGuard)
  @Post('/create')
  createQuiz(@Body() dto: CreateQuizDto, @User('id') userId: number) {
    return this.quizesService.createQuiz(dto, userId);
  }

  @UseGuards(ApplyUserGuard)
  @Get('/all')
  getAllQuizes(@Body() dto: GetAllQuizesDto, @User('id') userId: number) {
    return this.quizesService.getAllQuizes(dto, userId);
  }

  @UseGuards(JwtGuard)
  @Get('/quiz/:id')
  getQuiz(@Param('id') quizId: string) {
    return this.quizesService.getQuiz(quizId);
  }

  @Get('/play/:id')
  getPlayQuiz(@Param('id') quizId: string) {
    return this.quizesService.getPlayQuiz(quizId);
  }

  @Get('/question/:id')
  getCorrectAnswer(@Param('id') questionId: string) {
    return this.quizesService.getCorrectAnswer(questionId);
  }

  @Get('/categories')
  getCategories() {
    return this.quizesService.getCategories();
  }

  @Get('/categories/count/:id')
  getCategoriesQuestionCount(@Param('id') categoryId: string) {
    return this.quizesService.getCategoryQuestionsCount(categoryId);
  }

  @UseGuards(ApplyUserGuard)
  @Get('/user/:id')
  getQuizesByUser(
    @Body() dto: GetAllQuizesDto,
    @Param('id', ParseIntPipe) userId,
    @User('id') currentUserId?: number
  ) {
    return this.quizesService.getUserQuizes(dto, userId, currentUserId);
  }

  @UseGuards(JwtGuard)
  @Delete('/quiz/:id')
  deleteQuiz(@Param('id') quizId: string, @User('id') userId: number) {
    return this.quizesService.deleteQuiz(quizId, userId);
  }

  @UseGuards(JwtGuard)
  @Put('/edit')
  editQuiz(@Body() dto: EditQuizDto, @User('id') userId: number) {
    return this.quizesService.editQuiz(dto, userId);
  }

  @UseGuards(JwtGuard)
  @Post('/rate')
  rateQuiz(@Body() dto: RateQuizDto, @User('id') userId: number) {
    return this.quizesService.rateQuiz(dto, userId);
  }

  @UseGuards(JwtGuard)
  @Get('/favourite')
  getFavouritesQuizes(
    @Body() dto: GetAllQuizesDto,
    @User('id') userId: number
  ) {
    return this.quizesService.getFavouritesQuizes(dto, userId);
  }

  @UseGuards(JwtGuard)
  @Post('/favourite/:id')
  addQuizToFavourites(@Param('id') quizId: string, @User('id') userId: number) {
    return this.quizesService.addQuizToFavourites(quizId, userId);
  }

  @UseGuards(JwtGuard)
  @Delete('/favourite/:id')
  removeQuizFromFavourites(
    @Param('id') quizId: string,
    @User('id') userId: number
  ) {
    return this.quizesService.removeQuizFromFavourites(quizId, userId);
  }
}

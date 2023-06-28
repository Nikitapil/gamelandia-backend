import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { QuizesService } from './quizes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { GetAllQuizesDto } from './dto/get-all-quizes.dto';
import { ApplyUserGuard } from '../guards/auth/apply-user.guard';
import { User } from '../decorators/User.decorator';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { CreateQuizDto } from './dto/create-quiz.dto';

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
}

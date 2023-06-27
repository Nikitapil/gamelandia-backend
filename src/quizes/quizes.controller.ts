import { Body, Controller, Post } from '@nestjs/common';
import { QuizesService } from './quizes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';

@Controller('quizes')
export class QuizesController {
  constructor(private quizesService: QuizesService) {}

  @Post('/generate')
  generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.quizesService.generateQuiz(dto);
  }
}

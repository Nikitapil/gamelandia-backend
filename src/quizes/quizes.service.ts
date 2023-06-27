import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { mapGeneratedQuestions } from './helpers/quiz-mappers';
import { IGeneratedQuestion } from './types';

@Injectable()
export class QuizesService {
  constructor(private readonly httpService: HttpService) {}

  async generateQuiz(dto: GenerateQuizDto) {
    const { data } = await this.httpService.axiosRef.get<{
      results: IGeneratedQuestion[];
    }>('https://opentdb.com/api.php?', {
      params: {
        ...dto
      }
    });
    console.log(data);
    return mapGeneratedQuestions(data.results);
  }
}

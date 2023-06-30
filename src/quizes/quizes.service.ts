import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { mapGeneratedQuestions } from './helpers/quiz-mappers';
import { ICategoryResponse, IGeneratedQuestion } from './types';
import { PrismaService } from '../prisma/prisma.service';
import { GetAllQuizesDto } from './dto/get-all-quizes.dto';
import { AllQuizesReturnDto } from './dto/all-quizes-return.dto';
import { ManyQuizesDto } from './dto/many-quizes.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { validateQuizQuestions } from './helpers/validators';
import { PlayQuizDto } from './dto/play-quiz.dto';

@Injectable()
export class QuizesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prismaService: PrismaService
  ) {}

  async generateQuiz(dto: GenerateQuizDto) {
    const { data } = await this.httpService.axiosRef.get<{
      results: IGeneratedQuestion[];
    }>('https://opentdb.com/api.php?', {
      params: {
        ...dto
      }
    });
    if (!data?.results?.length) {
      throw new NotFoundException('questions_not_found');
    }
    const questions = mapGeneratedQuestions(data.results);
    const quiz = await this.prismaService.quiz.create({
      data: {
        name: 'Untitled',
        questions: {
          createMany: {
            data: questions
          }
        }
      }
    });
    return { id: quiz.id };
  }

  async getAllQuizes(
    dto: GetAllQuizesDto,
    userId?: number
  ): Promise<AllQuizesReturnDto> {
    const { page = 1, limit = 10, search = '' } = dto;
    const offset = page * limit - limit;
    const where = {
      OR: [
        {
          isPrivate: false
        },
        {
          userId
        }
      ],
      name: {
        contains: search
      }
    };

    const totalCount = await this.prismaService.quiz.count({ where });

    const quizes = await this.prismaService.quiz.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: {
            questions: true
          }
        },
        favouritedBy: {
          where: {
            userId
          }
        },
        User: {
          select: {
            username: true
          }
        }
      }
    });

    return {
      quizes: quizes.map((quiz) => new ManyQuizesDto(quiz)),
      totalCount
    };
  }

  async createQuiz(dto: CreateQuizDto, userId: number) {
    validateQuizQuestions(dto.questions);
    try {
      await this.prismaService.quiz.create({
        data: {
          userId,
          name: dto.name,
          isPrivate: dto.isPrivate,
          questions: {
            createMany: {
              data: dto.questions
            }
          }
        }
      });

      return { message: 'created' };
    } catch (e) {
      throw new BadRequestException('Error while creating quiz');
    }
  }

  async getQuiz(quizId: string) {
    const quiz = await this.prismaService.quiz.findUnique({
      where: {
        id: quizId
      },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      throw new NotFoundException('quiz_not_found');
    }

    return quiz;
  }

  async getPlayQuiz(quizId: string) {
    const quiz = await this.getQuiz(quizId);
    return new PlayQuizDto(quiz);
  }

  async getCorrectAnswer(questionId: string) {
    const question = await this.prismaService.quizQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      throw new NotFoundException('question_not_found');
    }

    return { answer: question.correctAnswer };
  }

  async getCategories() {
    try {
      const { data } = await this.httpService.axiosRef.get<ICategoryResponse>(
        'https://opentdb.com/api_category.php'
      );
      return data.trivia_categories;
    } catch (e) {
      throw new BadRequestException('error_fetching_categories');
    }
  }

  async getCategoryQuestionsCount(categoryId: string) {
    try {
      const { data } = await this.httpService.axiosRef.get<ICategoryResponse>(
        `https://opentdb.com/api_count.php?category=${categoryId}`
      );
      return data;
    } catch (e) {
      throw new BadRequestException('error_fetching_questions_count');
    }
  }
}

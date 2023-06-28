import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { mapGeneratedQuestions } from './helpers/quiz-mappers';
import { IGeneratedQuestion } from './types';
import { PrismaService } from '../prisma/prisma.service';
import { GetAllQuizesDto } from './dto/get-all-quizes.dto';
import { AllQuizesReturnDto } from './dto/all-quizes-return.dto';
import { ManyQuizesDto } from './dto/many-quizes.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { validateQuizQuestions } from './helpers/validators';

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
  }
}

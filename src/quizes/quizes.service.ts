import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { mapGeneratedQuestions } from './helpers/quiz-mappers';
import {
  ICategoryQuestionResponse,
  ICategoryResponse,
  IGeneratedQuestion,
  IGetQuizesParams,
  IGetQuizMethodParams,
  IToggleQuizInFavoritesParams,
  TQuizWhereInput
} from './types';
import { PrismaService } from '../prisma/prisma.service';
import { GetAllQuizesDto } from './dto/get-all-quizes.dto';
import { AllQuizesReturnDto } from './dto/all-quizes-return.dto';
import { QuizDto } from './dto/quiz.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import {
  validateQuizForUser,
  validateQuizQuestions
} from './helpers/validators';
import { PlayQuizDto } from './dto/play-quiz.dto';
import { EditQuizDto } from './dto/edit-quiz.dto';
import { RateQuizDto } from './dto/rate-quiz.dto';
import { ReturnGeneratedQuizDto } from './dto/return-generated-quiz.dto';
import { SuccessMessageDto } from '../dto/success-message.dto';
import { SingleQuizReturnDto } from './dto/single-quiz-return.dto';
import { CorrectAnswerReturnDto } from './dto/correct-answer-return.dto';
import { QuizCategoriesReturnDto } from './dto/quiz-categories-return.dto';
import { CategoryCountReturnDto } from './dto/category-count-return.dto';
import { TUserRole } from '../types';
import { UserReturnDto } from '../auth/dto/user-return.dto';

@Injectable()
export class QuizesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prismaService: PrismaService
  ) {}

  private async getManyQuizes({
    dto,
    currentUser,
    where
  }: IGetQuizesParams): Promise<AllQuizesReturnDto> {
    const { page = 1, limit = 10, search = '' } = dto;
    const offset = page * limit - limit;

    where.name = {
      contains: search,
      mode: 'insensitive'
    };

    const totalCount = await this.prismaService.quiz.count({ where });
    const quizes = await this.prismaService.quiz.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        _count: {
          select: {
            questions: true,
            comments: true
          }
        },
        favouritedBy: {
          where: {
            userId: currentUser?.id || 0
          }
        },
        User: {
          select: {
            username: true
          }
        }
      }
    });
    const ratings = await this.prismaService.quizRating.groupBy({
      by: ['quizId'],
      where: {
        quizId: {
          in: quizes.map((q) => q.id)
        }
      },
      _avg: {
        rating: true
      }
    });

    return {
      quizes: quizes.map((quiz) => new QuizDto({ quiz, ratings, currentUser })),
      totalCount
    };
  }

  async generateQuiz(dto: GenerateQuizDto): Promise<ReturnGeneratedQuizDto> {
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
        },
        isGenerated: true
      }
    });
    return { id: quiz.id };
  }

  async getAllQuizes(
    dto: GetAllQuizesDto,
    user: UserReturnDto | undefined
  ): Promise<AllQuizesReturnDto> {
    const where: TQuizWhereInput =
      user?.role === 'Admin'
        ? {}
        : {
            OR: [
              {
                isPrivate: false
              },
              {
                userId: user?.id || 0
              }
            ]
          };
    return this.getManyQuizes({ dto, where, currentUser: user });
  }

  async getUserQuizes(
    dto: GetAllQuizesDto,
    userId: number,
    currentUser: UserReturnDto | undefined
  ) {
    const where: TQuizWhereInput = {
      userId
    };

    if (userId !== currentUser?.id && currentUser?.role !== 'Admin') {
      where.isPrivate = false;
    }

    return this.getManyQuizes({ dto, currentUser, where });
  }

  async createQuiz(
    dto: CreateQuizDto,
    userId: number
  ): Promise<SuccessMessageDto> {
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

      return { message: 'success' };
    } catch (e) {
      throw new BadRequestException('Error while creating quiz');
    }
  }

  async getQuiz({
    quizId,
    user
  }: IGetQuizMethodParams): Promise<SingleQuizReturnDto> {
    const quiz = await this.prismaService.quiz.findUnique({
      where: {
        id: quizId
      },
      include: {
        questions: true,
        favouritedBy: {
          where: {
            userId: user?.id || 0
          }
        },
        User: {
          select: {
            username: true
          }
        }
      }
    });

    if (!quiz) {
      throw new NotFoundException('quiz_not_found');
    }

    const rating = await this.prismaService.quizRating.aggregate({
      where: {
        quizId
      },
      _avg: {
        rating: true
      }
    });

    const { favouritedBy } = quiz;

    return new SingleQuizReturnDto({
      rating: rating._avg.rating,
      quiz: quiz,
      isInFavourites: !!favouritedBy.length,
      currentUser: user
    });
  }

  async getPlayQuiz({ quizId, user }: IGetQuizMethodParams) {
    const quiz = await this.getQuiz({ quizId, user });
    return new PlayQuizDto(quiz);
  }

  async getCorrectAnswer(questionId: string): Promise<CorrectAnswerReturnDto> {
    const question = await this.prismaService.quizQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      throw new NotFoundException('question_not_found');
    }

    return { answer: question.correctAnswer };
  }

  async getCategories(): Promise<QuizCategoriesReturnDto[]> {
    try {
      const { data } = await this.httpService.axiosRef.get<ICategoryResponse>(
        'https://opentdb.com/api_category.php'
      );
      return data.trivia_categories;
    } catch (e) {
      throw new BadRequestException('error_fetching_categories');
    }
  }

  async getCategoryQuestionsCount(
    categoryId: string
  ): Promise<CategoryCountReturnDto> {
    try {
      const { data } =
        await this.httpService.axiosRef.get<ICategoryQuestionResponse>(
          `https://opentdb.com/api_count.php?category=${categoryId}`
        );
      return data.category_question_count;
    } catch (e) {
      throw new BadRequestException('error_fetching_questions_count');
    }
  }

  async deleteQuiz(quizId: string, userId: number, userRole?: TUserRole) {
    const quiz = await this.prismaService.quiz.findUnique({
      where: {
        id: quizId
      }
    });

    validateQuizForUser(userId, quiz, userRole);

    await this.prismaService.quiz.delete({
      where: {
        id: quizId
      }
    });
    return new SuccessMessageDto();
  }

  async editQuiz(dto: EditQuizDto, userId: number): Promise<SuccessMessageDto> {
    const quiz = await this.prismaService.quiz.findUnique({
      where: {
        id: dto.id
      }
    });

    validateQuizForUser(userId, quiz);
    validateQuizQuestions(dto.questions);

    try {
      await this.prismaService.quiz.update({
        where: {
          id: dto.id
        },
        data: {
          userId,
          name: dto.name,
          isPrivate: dto.isPrivate,
          questions: {
            deleteMany: {
              quizId: dto.id
            },
            createMany: {
              data: dto.questions
            }
          }
        }
      });

      return { message: 'success' };
    } catch (e) {
      throw new BadRequestException('Error while creating quiz');
    }
  }

  async rateQuiz(dto: RateQuizDto, userId: number): Promise<SuccessMessageDto> {
    const quiz = await this.prismaService.quiz.findUnique({
      where: {
        id: dto.quizId
      }
    });

    if (!quiz) {
      throw new NotFoundException();
    }

    await this.prismaService.quizRating.upsert({
      where: {
        uniq_combination: { quizId: dto.quizId, userId }
      },
      create: {
        userId,
        quizId: dto.quizId,
        rating: dto.rating
      },
      update: {
        rating: dto.rating
      }
    });

    return { message: 'success' };
  }

  private getFavouriteQuizOnUser(quizId: string, userId: number) {
    return this.prismaService.favoritesQuizesOnUser.findUnique({
      where: {
        userId_quizId: {
          quizId,
          userId
        }
      }
    });
  }

  async toggleQuizInFavorites({
    quizId,
    userId
  }: IToggleQuizInFavoritesParams): Promise<SuccessMessageDto> {
    const quiz = await this.prismaService.quiz.findUnique({
      where: {
        id: quizId
      },
      include: {
        favouritedBy: {
          where: {
            userId
          }
        }
      }
    });

    if (!quiz) {
      throw new NotFoundException('quiz_not_found');
    }

    return quiz.favouritedBy.length
      ? this.removeQuizFromFavourites(quizId, userId)
      : this.addQuizToFavourites(quizId, userId);
  }

  async addQuizToFavourites(
    quizId: string,
    userId: number
  ): Promise<SuccessMessageDto> {
    await this.prismaService.favoritesQuizesOnUser.create({
      data: {
        quizId,
        userId
      }
    });

    return { message: 'success' };
  }

  async removeQuizFromFavourites(
    quizId: string,
    userId: number
  ): Promise<SuccessMessageDto> {
    await this.prismaService.favoritesQuizesOnUser.delete({
      where: {
        userId_quizId: {
          userId,
          quizId
        }
      }
    });

    return { message: 'success' };
  }

  async getFavouritesQuizes(
    dto: GetAllQuizesDto,
    currentUser: UserReturnDto | undefined
  ) {
    const where: TQuizWhereInput = {
      favouritedBy: {
        some: {
          userId: currentUser?.id
        }
      }
    };
    return this.getManyQuizes({ dto, currentUser, where });
  }
}

import { INestApplication } from '@nestjs/common';
import { createTestApp, loginUser, registerUser } from './utils/test-utils';
import * as pactum from 'pactum';
import { CreateQuizDto } from '../src/quizes/dto/create-quiz.dto';
import { GetAllQuizesDto } from '../src/quizes/dto/get-all-quizes.dto';
import { EditQuizDto } from '../src/quizes/dto/edit-quiz.dto';
import { RateQuizDto } from '../src/quizes/dto/rate-quiz.dto';

describe('Quizes tests', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp(5004);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createQuiz', () => {
    let dto: CreateQuizDto;
    let accessToken;

    beforeEach(() => {
      dto = {
        name: 'Test Quiz',
        isPrivate: false,
        questions: [
          {
            question: 'Test?',
            correctAnswer: 'Test correct answer',
            incorrectAnswers: ['123', '456', '789']
          },
          {
            question: 'Test2?',
            correctAnswer: 'Test correct answer',
            incorrectAnswers: ['123', '456', '789']
          },
          {
            question: 'Test3?',
            correctAnswer: 'Test correct answer',
            incorrectAnswers: ['123', '456', '789']
          }
        ]
      };
    });

    beforeAll(async () => {
      accessToken = await registerUser({
        email: 'quiz@quiz.quiz',
        username: 'test',
        password: '12345678'
      });
    });

    it('should throw for unauthorized', () => {
      return pactum
        .spec()
        .post('/quizes/create')
        .withBody(dto)
        .expectStatus(401);
    });

    it('should throw if no quiz name', () => {
      delete dto.name;
      return pactum
        .spec()
        .post('/quizes/create')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('Quiz name should be string');
    });

    it('should throw if no quiz isPrivate field', () => {
      delete dto.isPrivate;
      return pactum
        .spec()
        .post('/quizes/create')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('isPrivate field should be true or false');
    });

    it('should throw if quiz questions length < 3', () => {
      dto.questions = [
        {
          question: 'Test?',
          correctAnswer: 'Test correct answer',
          incorrectAnswers: ['123', '456', '789']
        }
      ];
      return pactum
        .spec()
        .post('/quizes/create')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('min_quiz_questions_length_error');
    });

    it('should throw if no quiz question incorrect answers length', () => {
      dto.questions = [
        {
          question: 'Test?',
          correctAnswer: 'Test correct answer',
          incorrectAnswers: []
        },
        {
          question: 'Test2?',
          correctAnswer: 'Test correct answer',
          incorrectAnswers: ['123', '456', '789']
        },
        {
          question: 'Test3?',
          correctAnswer: 'Test correct answer',
          incorrectAnswers: ['123', '456', '789']
        }
      ];
      return pactum
        .spec()
        .post('/quizes/create')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('min_quiz_questions_incorrect_answers_error');
    });

    it('should create quiz', () => {
      return pactum
        .spec()
        .post('/quizes/create')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(201)
        .expectJson('message', 'success');
    });

    it('should create private quiz', () => {
      dto.isPrivate = true;
      return pactum
        .spec()
        .post('/quizes/create')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(201)
        .expectJson('message', 'success');
    });
  });

  describe('get all quizes', () => {
    let accessToken;

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'quiz@quiz.quiz',
        password: '12345678'
      });
    });

    it('should return all created quizes without private', () => {
      return pactum
        .spec()
        .post('/quizes/all')
        .expectStatus(200)
        .expectJson('totalCount', 1);
    });

    it('should return all created quizes with private', () => {
      return pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectStatus(200)
        .expectJson('totalCount', 2);
    });

    it('should return 1 quiz due to pagination', () => {
      const dto: GetAllQuizesDto = {
        page: 1,
        limit: 1,
        search: ''
      };
      return pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(200)
        .expectJsonLike('quizes', [
          {
            name: 'Test Quiz',
            isInFavourites: false,
            questionsCount: 3,
            author: 'test',
            rating: null
          }
        ]);
    });
  });

  describe('getQuiz', () => {
    let accessToken;

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'quiz@quiz.quiz',
        password: '12345678'
      });
    });

    it('should throw for unauthorized', () => {
      return pactum.spec().get('/quizes/quiz/1234').expectStatus(401);
    });

    it('should return quiz', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .returns((ctx) => ctx.res.body.quizes);
      const quiz = quizes.find((q) => q.isPrivate);

      return pactum
        .spec()
        .get(`/quizes/quiz/${quiz.id}`)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectStatus(200)
        .expectJson('name', 'Test Quiz');
    });
  });

  describe('getPlayQuiz', () => {
    let accessToken;

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'quiz@quiz.quiz',
        password: '12345678'
      });
    });

    it('should return play quiz with questions', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      return pactum
        .spec()
        .get(`/quizes/play/${quiz.id}`)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectStatus(200)
        .expectJson('name', 'Test Quiz')
        .expectBodyContains('questions');
    });
  });

  describe('getCorrectAnswer', () => {
    it('should return correct answer', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      const questions = await pactum
        .spec()
        .get(`/quizes/play/${quiz.id}`)
        .returns((ctx) => ctx.res.body.questions);

      const fQuestion = questions[0];

      return pactum
        .spec()
        .get(`/quizes/question/${fQuestion.id}`)
        .expectStatus(200)
        .expectJson('answer', 'Test correct answer');
    });
  });

  describe('getQuizesByUser', () => {
    let accessToken;

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'quiz@quiz.quiz',
        password: '12345678'
      });
    });

    it('should return quizes by user without private', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      return pactum
        .spec()
        .post(`/quizes/user/${quiz.userId}`)
        .expectStatus(200)
        .expectJson('totalCount', 1);
    });

    it('should return quizes by user with private for authorized', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      return pactum
        .spec()
        .post(`/quizes/user/${quiz.userId}`)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectStatus(200)
        .expectJson('totalCount', 2);
    });
  });

  describe('deleteQuiz', () => {
    let accessToken;

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'quiz@quiz.quiz',
        password: '12345678'
      });
    });

    it('should throw for unathorized', () => {
      return pactum.spec().delete(`/quizes/quiz/123`).expectStatus(401);
    });

    it('should delete quiz', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      await pactum
        .spec()
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .delete(`/quizes/quiz/${quiz.id}`)
        .expectJson('message', 'success');

      return pactum
        .spec()
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .post('/quizes/all')
        .expectJson('totalCount', 1);
    });
  });

  describe('edit quiz', () => {
    let accessToken;
    let dto: EditQuizDto;

    beforeEach(() => {
      dto = {
        id: '123',
        name: 'New Test Quiz',
        isPrivate: false,
        questions: [
          {
            question: 'Test?',
            correctAnswer: 'Test correct answer',
            incorrectAnswers: ['123', '456', '789']
          },
          {
            question: 'Test2?',
            correctAnswer: 'Test correct answer',
            incorrectAnswers: ['123', '456', '789']
          },
          {
            question: 'Test3?',
            correctAnswer: 'Test correct answer',
            incorrectAnswers: ['123', '456', '789']
          }
        ]
      };
    });

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'quiz@quiz.quiz',
        password: '12345678'
      });
    });

    it('should throw for unauthorized', () => {
      return pactum.spec().put('/quizes/edit').expectStatus(401);
    });

    it('should throw for unknown quiz id', () => {
      return pactum
        .spec()
        .put('/quizes/edit')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(404);
    });

    it('should edit quiz successfully', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      dto.id = quiz.id;

      await pactum
        .spec()
        .put('/quizes/edit')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(200)
        .expectJson('message', 'success');

      return pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectStatus(200)
        .expectBodyContains('New Test Quiz');
    });
  });

  describe('rateQuiz', () => {
    let accessToken;
    const dto: RateQuizDto = {
      quizId: '123',
      rating: 5
    };

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'quiz@quiz.quiz',
        password: '12345678'
      });
    });

    it('should throw for unauthorized', () => {
      pactum.spec().post('/quizes/rate').expectStatus(401);
    });

    it('should throw for unknown quiz', () => {
      pactum
        .spec()
        .post('/quizes/rate')
        .withBody(dto)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectStatus(404);
    });

    it('should rate quiz successfully', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      dto.quizId = quiz.id;

      await pactum
        .spec()
        .post('/quizes/rate')
        .withBody(dto)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectJson('message', 'success');

      return pactum
        .spec()
        .get(`/quizes/quiz/${quiz.id}`)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectStatus(200)
        .expectJson('rating', 5);
    });
  });

  describe('favourites quizes', () => {
    let accessToken;

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'quiz@quiz.quiz',
        password: '12345678'
      });
    });

    it('should throw for unauthorized methods', async () => {
      await pactum.spec().post('/quizes/favourite').expectStatus(401);
      await pactum.spec().post('/quizes/favourite/123').expectStatus(401);
      await pactum.spec().delete('/quizes/favourite/123').expectStatus(401);
    });

    it('should add quiz to favourites and return it', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      await pactum
        .spec()
        .post(`/quizes/favourite/${quiz.id}`)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectJson('message', 'success');

      return pactum
        .spec()
        .post(`/quizes/favourite`)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectJson('totalCount', 1);
    });

    it('should remove quiz from favourites', async () => {
      const quizes = await pactum
        .spec()
        .post('/quizes/all')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .returns((ctx) => ctx.res.body.quizes);

      const quiz = quizes[0];

      await pactum
        .spec()
        .delete(`/quizes/favourite/${quiz.id}`)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectJson('message', 'success');

      return pactum
        .spec()
        .post(`/quizes/favourite`)
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectJson('totalCount', 0);
    });
  });
});

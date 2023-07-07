import { INestApplication } from '@nestjs/common';
import { createTestApp, registerUser } from './utils/test-utils';
import * as pactum from 'pactum';
import { CreateQuizDto } from '../src/quizes/dto/create-quiz.dto';

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
    it('should return all created quizes', () => {
      return pactum
        .spec()
        .post('/quizes/all')
        .expectStatus(200)
        .expectJson('totalCount', 1);
    });
  });
});

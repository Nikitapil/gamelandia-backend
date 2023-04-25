import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { createTestApp, registerUser } from './utils/test-utils';
import { CreateScoreDto } from '../src/games/dto/create-score.dto';

describe('Games tests', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp(5002);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('getScoresByGameName', () => {
    it('should get 10 scores by game name', () => {
      return pactum
        .spec()
        .get('/games/score/tetris')
        .expectStatus(200)
        .expectJsonLength(10);
    });

    it('should body to contain value', () => {
      return pactum
        .spec()
        .get('/games/score/tetris')
        .expectStatus(200)
        .expectBodyContains('value');
    });

    it('should get 9 scores for snake game with level', () => {
      return pactum
        .spec()
        .get('/games/score/snake')
        .expectStatus(200)
        .expectJsonLength(9)
        .expectBodyContains('easy')
        .expectBodyContains('medium')
        .expectBodyContains('hard');
    });
  });

  describe('addScore', () => {
    let dto: CreateScoreDto = {
      gameName: 'tetris',
      value: 1234
    };
    let accessToken;

    beforeEach(async () => {
      dto = {
        gameName: 'tetris',
        value: 1234
      };
    });

    beforeAll(async () => {
      accessToken = await registerUser({
        email: 'test2@test.test',
        username: 'test',
        password: '12345678'
      });
    });

    it('should throw for unauthorized', () => {
      return pactum.spec().post('/games/score').withBody(dto).expectStatus(401);
    });

    it('should throw if no game name', async () => {
      delete dto.gameName;
      return pactum
        .spec()
        .post('/games/score')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('gameName should be string');
    });

    it('should throw if no value', async () => {
      delete dto.value;
      return pactum
        .spec()
        .post('/games/score')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('Score value should be number');
    });

    it('should throw if level in dto and game without level', async () => {
      dto.level = 'easy';
      return pactum
        .spec()
        .post('/games/score')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('level does not exist');
    });

    it('should throw if game with level and no level in dto', async () => {
      dto.gameName = 'snake';
      return pactum
        .spec()
        .post('/games/score')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('level not specified');
    });

    it('should create score and return it with value and username', async () => {
      return pactum
        .spec()
        .post('/games/score')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(201)
        .expectBodyContains('username')
        .expectBodyContains('value');
    });

    it('should create score for game with level and return it with value and username', async () => {
      dto.gameName = 'snake';
      dto.level = 'easy';
      return pactum
        .spec()
        .post('/games/score')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(201)
        .expectBodyContains('username')
        .expectBodyContains('value')
        .expectBodyContains('easy');
    });
  });
});

import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { createTestApp, loginUser, registerUser } from './utils/test-utils';
import { CreateScoreDto } from '../src/games/dto/score/create-score.dto';
import { UpdateWinsCountDto } from '../src/games/dto/win-count/update-wins-count.dto';

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
        .expectJsonLength('scores', 10)
        .expectJson('withLevels', false);
    });

    it('should body to contain value', () => {
      return pactum
        .spec()
        .get('/games/score/tetris')
        .expectStatus(200)
        .expectBodyContains('value');
    });

    it('should get 30 scores for snake game with level', () => {
      return pactum
        .spec()
        .get('/games/score/snake')
        .expectStatus(200)
        .expectJsonLength('scores', 30)
        .expectJson('withLevels', true)
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

  describe('update wins count', () => {
    let dto: UpdateWinsCountDto = {
      gameName: 'snake',
      level: 'easy'
    };
    let accessToken;

    beforeEach(async () => {
      dto = {
        gameName: 'snake',
        level: 'easy'
      };
    });

    beforeAll(async () => {
      accessToken = await registerUser({
        email: 'test3@test.test',
        username: 'test',
        password: '12345678'
      });
    });

    it('should throw if user Unuathorized', () => {
      return pactum.spec().post('/games/win').withBody(dto).expectStatus(401);
    });

    it('should throw if dto with level and game not', () => {
      dto.gameName = 'tetris';
      return pactum
        .spec()
        .post('/games/win')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('level does not exist');
    });

    it('should throw if game with level and dto not', () => {
      delete dto.level;
      return pactum
        .spec()
        .post('/games/win')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('level not specified');
    });

    it('should throw if dto without gameName', () => {
      delete dto.gameName;
      return pactum
        .spec()
        .post('/games/win')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400);
    });

    it('should create winCount', () => {
      return pactum
        .spec()
        .post('/games/win')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(201)
        .expectJson('[0].value', 1);
    });

    it('should update winCount', () => {
      return pactum
        .spec()
        .post('/games/win')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(201)
        .expectJson('[0].value', 2)
        .expectJsonLength(1);
    });

    it('should get winCount by game name', () => {
      return pactum
        .spec()
        .get('/games/win/snake')
        .expectStatus(200)
        .expectJson('[0].value', 2)
        .expectJsonLength(1);
    });
  });

  describe('gameStatistic', () => {
    let accessToken;

    beforeAll(async () => {
      accessToken = await loginUser({
        email: 'test3@test.test',
        password: '12345678'
      });
    });

    it('should throw if unauthorized', () => {
      return pactum.spec().get('/games/my_statistics').expectStatus(401);
    });

    it('should get statistics', () => {
      return pactum
        .spec()
        .get('/games/my_statistics')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .expectStatus(200)
        .expectBodyContains('numbers')
        .expectBodyContains('battleship')
        .expectBodyContains('chess')
        .expectBodyContains('tetris')
        .expectBodyContains('dyno');
    });
  });
});

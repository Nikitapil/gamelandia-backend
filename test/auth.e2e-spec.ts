import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { createTestApp } from './utils/test-utils';

describe('Auth tests', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp(5001);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Sign up', () => {
    let dto;
    beforeEach(() => {
      dto = {
        email: 'test@test.test',
        password: '12345678',
        username: 'Nick'
      };
    });

    it('should throw if email is invalid', () => {
      dto.email = '123wqeqdsc';
      return pactum
        .spec()
        .post('/auth/signup')
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('Email value is not valid');
    });

    it('should throw if password is too short', () => {
      dto.password = '1234567';
      return pactum
        .spec()
        .post('/auth/signup')
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('Password min length is 8');
    });

    it('should throw if password is too short', () => {
      delete dto.username;
      return pactum
        .spec()
        .post('/auth/signup')
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('Username must be a string value');
    });

    it('should signup successfully', () => {
      return pactum
        .spec()
        .post('/auth/signup')
        .withBody(dto)
        .expectStatus(201)
        .expectBodyContains('user')
        .expectBodyContains('accessToken');
    });

    it('should throw an error if user already exists', () => {
      return pactum
        .spec()
        .post('/auth/signup')
        .withBody(dto)
        .expectStatus(403)
        .expectBodyContains('user_already_exist');
    });
  });

  describe('Sign in', () => {
    let dto;
    beforeEach(() => {
      dto = {
        email: 'test@test.test',
        password: '12345678'
      };
    });

    it('should throw if email user does not exist', () => {
      dto.email = 'notExisting@test.test';
      return pactum
        .spec()
        .post('/auth/signin')
        .withBody(dto)
        .expectStatus(404)
        .expectBodyContains('user_not_found');
    });

    it('should throw if wrong password', () => {
      dto.password = 'wrong password';
      return pactum
        .spec()
        .post('/auth/signin')
        .withBody(dto)
        .expectStatus(404)
        .expectBodyContains('user_not_found');
    });

    it('should signin successfully', () => {
      return pactum
        .spec()
        .post('/auth/signin')
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains('accessToken')
        .expectBodyContains('user');
    });
  });

  describe('refresh and logout', () => {
    let cookie;

    beforeEach(async () => {
      cookie = await pactum
        .spec()
        .post('/auth/signin')
        .withBody({
          email: 'test@test.test',
          password: '12345678'
        })
        .returns((ctx) => {
          return ctx.res.headers['set-cookie'];
        });
    });

    it('should throw if no refreshToken', () => {
      return pactum.spec().get('/auth/refresh').expectStatus(401);
    });

    it('should refresh successfully', async () => {
      return pactum
        .spec()
        .get('/auth/refresh')
        .withCookies(cookie[0])
        .expectStatus(200);
    });

    it('should logout successfully', () => {
      return pactum
        .spec()
        .get('/auth/logout')
        .withCookies(cookie[0])
        .expectStatus(200)
        .expectBodyContains('success');
    });

    it('should throw 401 after logout and refresh', async () => {
      await pactum
        .spec()
        .get('/auth/logout')
        .withCookies(cookie[0])
        .expectStatus(200)
        .expectBodyContains('success');
      return pactum
        .spec()
        .get('/auth/refresh')
        .withCookies(cookie[0])
        .expectStatus(401);
    });
  });
});

import { INestApplication } from '@nestjs/common';
import { createTestApp, registerUser } from './utils/test-utils';
import * as pactum from 'pactum';
import { EditUserDto } from '../src/users/dto/edit-user.dto';

describe('users tests', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp(5003);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('edit user', () => {
    let accessToken;
    let dto: EditUserDto;
    beforeAll(async () => {
      accessToken = await registerUser({
        email: 'test4@test.test',
        username: 'test',
        password: '12345678'
      });
    });

    beforeEach(() => {
      dto = {
        username: 'test new',
        email: 'asdf@asdf.asdf',
        password: '12345678'
      };
    });

    it('should throw if unauthorized', () => {
      return pactum.spec().put('/users/edit').withBody(dto).expectStatus(401);
    });

    it('should throw if email is invalid', () => {
      dto.email = 'qweqwe';
      return pactum
        .spec()
        .put('/users/edit')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('Email value is not valid');
    });

    it('should throw if password is invalid', () => {
      dto.password = '123';
      return pactum
        .spec()
        .put('/users/edit')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(400)
        .expectBodyContains('Password min length is 8');
    });

    it('should return user back', () => {
      return pactum
        .spec()
        .put('/users/edit')
        .withHeaders({
          Authorization: `Bearer ${accessToken}`
        })
        .withBody(dto)
        .expectStatus(200)
        .expectJson('username', 'test new')
        .expectJson('email', 'asdf@asdf.asdf');
    });
  });
});

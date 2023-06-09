import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { CreateUserDto } from '../../src/auth/dto/create-user.dto';
import { LoginUserDto } from '../../src/auth/dto/login-user.dto';

export const createTestApp = async (port: number) => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule]
  }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true
    })
  );
  app.use(cookieParser());
  await app.init();

  await app.listen(port);

  const prisma = app.get(PrismaService);

  await prisma.cleanDb();
  pactum.request.setBaseUrl(`http://localhost:${port}`);
  return app;
};

export const registerUser = async (dto: CreateUserDto) => {
  return pactum
    .spec()
    .post('/auth/signup')
    .withBody(dto)
    .returns((ctx) => {
      return ctx.res.body.accessToken;
    });
};

export const loginUser = async (dto: LoginUserDto) => {
  return pactum
    .spec()
    .post('/auth/signin')
    .withBody(dto)
    .returns((ctx) => {
      return ctx.res.body.accessToken;
    });
};

export const getFirstQuiz = async (accessToken: string) => {
  const quizes = await pactum
    .spec()
    .post('/quizes/all')
    .withHeaders({
      Authorization: `Bearer ${accessToken}`
    })
    .returns((ctx) => ctx.res.body.quizes);

  return quizes[0];
};

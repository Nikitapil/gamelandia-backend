import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { GamesModule } from './games/games.module';
import { UsersModule } from './users/users.module';
import { QuizesModule } from './quizes/quizes.module';

export const swaggerSetup = (app: INestApplication) => {
  // Auth Module docs
  const authModuleOptions = new DocumentBuilder()
    .setTitle('Gamelandia auth api')
    .setDescription('Gamelandia auth api methods')
    .setVersion('1.0.0')
    .build();

  const authModuleDocument = SwaggerModule.createDocument(
    app,
    authModuleOptions,
    {
      include: [AuthModule]
    }
  );

  SwaggerModule.setup('/api/docs/auth', app, authModuleDocument);

  // Games Module docs
  const gamesModuleOptions = new DocumentBuilder()
    .setTitle('Gamelandia games api')
    .setDescription('Gamelandia games api methods')
    .setVersion('1.0.0')
    .build();

  const gamesModuleDocument = SwaggerModule.createDocument(
    app,
    gamesModuleOptions,
    {
      include: [GamesModule]
    }
  );

  SwaggerModule.setup('/api/docs/games', app, gamesModuleDocument);

  // Users Module docs
  const usersModuleOptions = new DocumentBuilder()
    .setTitle('Gamelandia users api')
    .setDescription('Gamelandia users api methods')
    .setVersion('1.0.0')
    .build();

  const usersModuleDocument = SwaggerModule.createDocument(
    app,
    usersModuleOptions,
    {
      include: [UsersModule]
    }
  );

  SwaggerModule.setup('/api/docs/users', app, usersModuleDocument);

  // Quizes Module docs
  const quizesModuleOptions = new DocumentBuilder()
    .setTitle('Gamelandia quizes api')
    .setDescription('Gamelandia quizes api methods')
    .setVersion('1.0.0')
    .build();

  const quizesModuleDocument = SwaggerModule.createDocument(
    app,
    quizesModuleOptions,
    {
      include: [QuizesModule]
    }
  );

  SwaggerModule.setup('/api/docs/quizes', app, quizesModuleDocument);
};

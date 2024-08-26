import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { GamesModule } from './games/games.module';
import { UsersModule } from './users/users.module';
import { MailingModule } from './mailing/mailing.module';
import { QuizesModule } from './quizes/quizes.module';
import { QuizCommentsModule } from './quiz-comments/quiz-comments.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    GamesModule,
    UsersModule,
    MailingModule,
    QuizesModule,
    QuizCommentsModule
  ]
})
export class AppModule {}

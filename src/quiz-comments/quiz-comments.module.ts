import { Module } from '@nestjs/common';
import { QuizCommentsController } from './quiz-comments.controller';
import { QuizCommentsService } from './quiz-comments.service';

@Module({
  controllers: [QuizCommentsController],
  providers: [QuizCommentsService]
})
export class QuizCommentsModule {}

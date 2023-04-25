import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { GamesModule } from './games/games.module';

@Module({
  imports: [AuthModule, PrismaModule, GamesModule]
})
export class AppModule {}

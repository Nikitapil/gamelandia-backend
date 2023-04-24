import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as process from 'process';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  // Only for tests usage
  cleanDb() {
    return this.$transaction([this.user.deleteMany()]);
  }
}

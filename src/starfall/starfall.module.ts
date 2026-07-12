import { Module } from '@nestjs/common';
import { StarfallService } from './starfall.service';
import { StarfallController } from './starfall.controller';

@Module({
  providers: [StarfallService],
  controllers: [StarfallController]
})
export class StarfallModule {}

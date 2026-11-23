import { Module } from '@nestjs/common';
import { StarfallService } from './starfall.service';
import { StarfallController } from './starfall.controller';
import { JwtModule } from '@nestjs/jwt';
import { StarfallGateway } from './starfall.gateway';
import { StarfallRealtimeService } from './starfall-realtime.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [StarfallService, StarfallGateway, StarfallRealtimeService],
  controllers: [StarfallController],
  exports: [StarfallService]
})
export class StarfallModule {}

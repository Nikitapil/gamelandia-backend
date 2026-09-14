import { ApiProperty } from '@nestjs/swagger';

export class StarfallLobbyPlayerDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  username: string;
}

export class StarfallLobbyDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, enum: ['waiting', 'active', 'finished'] })
  status: 'waiting' | 'active' | 'finished';

  @ApiProperty({ type: Number })
  version: number;

  @ApiProperty({ type: Number })
  startingHp: number;

  @ApiProperty({ type: [StarfallLobbyPlayerDto] })
  players: StarfallLobbyPlayerDto[];
}

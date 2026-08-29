import { ApiProperty } from '@nestjs/swagger';

export class StarfallGameListItemDto {
  @ApiProperty({ type: String, description: 'Starfall game id' })
  id: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Game creation date'
  })
  createdAt: Date;

  @ApiProperty({
    type: [String],
    description: 'Usernames of players connected to the game'
  })
  players: string[];
}

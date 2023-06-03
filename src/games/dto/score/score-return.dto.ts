import { ApiProperty } from '@nestjs/swagger';

export class ScoreReturnDto {
  @ApiProperty({ example: '1', description: 'score id' })
  id: number;

  @ApiProperty({
    example: '12023-04-25T12:34:32.191Z',
    description: 'created date property'
  })
  createdAt: string;

  @ApiProperty({ example: '1', description: 'score value' })
  value: number;

  @ApiProperty({ example: 'easy', description: 'game level' })
  level?: string | null;

  @ApiProperty({ example: 'tetris', description: 'game name' })
  gameName: string;

  @ApiProperty({ example: '1', description: 'userId of score owner' })
  userId: number;

  @ApiProperty({
    example: { username: 'Nick' },
    description: 'username of score owner'
  })
  User: { username: string } | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameUserDto } from '../GameUserDto';

export class WinCountReturnDto {
  @ApiProperty({ example: '1', description: 'winCount id', type: Number })
  id: number;

  @ApiProperty({
    example: '12023-04-25T12:34:32.191Z',
    description: 'created date property',
    type: String
  })
  createdAt: Date;

  @ApiProperty({
    example: '12023-04-25T12:34:32.191Z',
    description: 'created date property',
    type: String
  })
  updatedAt: Date;

  @ApiProperty({ example: '1', description: 'winCount value', type: Number })
  value: number;

  @ApiPropertyOptional({
    example: 'easy',
    description: 'game level',
    type: String,
    nullable: true
  })
  level?: string | null;

  @ApiProperty({ example: 'tetris', description: 'game name', type: String })
  gameName: string;

  @ApiProperty({
    example: '1',
    description: 'userId of winCount owner',
    type: String
  })
  userId: number;

  @ApiProperty({
    example: { username: 'Nick' },
    description: 'username of score owner',
    type: GameUserDto,
    nullable: true
  })
  User: GameUserDto | null;
}

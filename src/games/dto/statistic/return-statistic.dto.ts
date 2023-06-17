import { ApiProperty } from '@nestjs/swagger';
import { Score, WinCount } from '@prisma/client';

export class ReturnStatisticDto {
  @ApiProperty({ example: 'numbers', description: 'Game name' })
  name: string;

  @ApiProperty({
    example: [
      {
        id: 177,
        createdAt: '2023-05-08T12:57:45.874Z',
        updatedAt: null,
        value: 2048,
        level: null,
        gameName: 'numbers',
        userId: 5
      }
    ],
    description: 'User game best score'
  })
  scores: Score[];

  @ApiProperty({
    example: [
      {
        id: 12,
        createdAt: '2023-06-12T15:20:42.854Z',
        updatedAt: '2023-06-12T15:20:42.854Z',
        value: 1,
        level: 'default',
        gameName: 'numbers',
        userId: 5
      }
    ],
    description: 'User win count for game'
  })
  winsCount: WinCount;
}

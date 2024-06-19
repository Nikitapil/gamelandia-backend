import { ApiProperty } from '@nestjs/swagger';
import { ScoreReturnDto } from '../score/score-return.dto';
import { WinCountReturnDto } from '../win-count/win-count-return.dto';

export class ReturnStatisticDto {
  @ApiProperty({ example: 'numbers', description: 'Game name', type: String })
  name: string;

  @ApiProperty({
    description: 'User game best score',
    type: ScoreReturnDto
  })
  score: ScoreReturnDto;

  @ApiProperty({
    description: 'User win count for game',
    type: WinCountReturnDto
  })
  winsCount: WinCountReturnDto;
}

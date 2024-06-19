import { ScoreReturnDto } from './score/score-return.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AddScoreReturnDto {
  @ApiProperty({ description: 'scores array', type: ScoreReturnDto })
  scores: ScoreReturnDto[];

  @ApiProperty({ description: 'flag is game with levels', type: Boolean })
  withLevels: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

export class ScoreUserDto {
  @ApiProperty({ description: 'score user username', type: String })
  username: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class GameUserDto {
  @ApiProperty({ description: 'score user username', type: String })
  username: string;
}

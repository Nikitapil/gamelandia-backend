import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class GetStarfallGamesQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Return only games that have not started',
    default: false
  })
  @IsOptional()
  @IsIn([true, false, 'true', 'false'])
  notStarted?: boolean | 'true' | 'false';
}

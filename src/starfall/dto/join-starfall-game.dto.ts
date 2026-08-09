import { IsInt, Min } from 'class-validator';

export class JoinStarfallGameDto {
  @IsInt()
  @Min(0)
  expectedVersion: number;

  @IsInt()
  @Min(1)
  startingHp = 50;
}

import { IsInt, Max, Min } from 'class-validator';

export class CreateStarfallGameDto {
  @IsInt()
  @Min(1)
  @Max(500)
  startingHp = 50;
}

import { IsInt, IsString, Min } from 'class-validator';

export class StartStarfallGameDto {
  @IsString()
  commandId: string;

  @IsInt()
  @Min(0)
  expectedVersion: number;
}

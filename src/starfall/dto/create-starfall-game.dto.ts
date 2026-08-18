import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStarfallGameDto {
  @ApiProperty({
    type: Number,
    description: 'Initial authority assigned to both players',
    example: 50,
    minimum: 1,
    maximum: 500,
    default: 50
  })
  @IsInt()
  @Min(1)
  @Max(500)
  startingHp = 50;
}

import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartStarfallGameDto {
  @ApiProperty({
    type: String,
    description: 'Unique idempotency key',
    example: 'uuid'
  })
  @IsString()
  commandId: string;

  @ApiProperty({
    type: Number,
    description: 'Game state version expected by the client',
    example: 1,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  expectedVersion: number;
}

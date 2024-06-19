import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWinsCountDto {
  @ApiProperty({ example: 'tetris', description: 'game name', type: String })
  @IsString({ message: 'gameName should be string' })
  gameName: string;

  @ApiPropertyOptional({
    example: 'easy',
    description: 'game level',
    type: String
  })
  @IsString({ message: 'Game level should be string' })
  @IsOptional()
  level?: string;
}

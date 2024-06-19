import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScoreDto {
  @ApiProperty({ example: 'tetris', description: 'game name', type: String })
  @IsString({ message: 'gameName should be string' })
  gameName: string;

  @ApiProperty({ example: '123', description: 'score value', type: Number })
  @IsNumber({}, { message: 'Score value should be number' })
  value: number;

  @ApiPropertyOptional({
    example: 'easy',
    description: 'game level',
    type: String
  })
  @IsString({ message: 'Game level should be string' })
  @IsOptional()
  level?: string;
}

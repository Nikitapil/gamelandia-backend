import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScoreDto {
  @ApiProperty({ example: 'tetris', description: 'game name' })
  @IsString({ message: 'gameName should be string' })
  gameName: string;

  @ApiProperty({ example: '123', description: 'score value' })
  @IsNumber({}, { message: 'Score value should be number' })
  value: number;

  @ApiProperty({ example: 'easy', description: 'game level' })
  @IsString({ message: 'Game level should be string' })
  @IsOptional()
  level?: string;
}

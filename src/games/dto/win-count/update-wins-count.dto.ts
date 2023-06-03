import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWinsCountDto {
  @ApiProperty({ example: 'tetris', description: 'game name' })
  @IsString({ message: 'gameName should be string' })
  gameName: string;

  @ApiProperty({ example: 'easy', description: 'game level' })
  @IsString({ message: 'Game level should be string' })
  @IsOptional()
  level?: string;
}

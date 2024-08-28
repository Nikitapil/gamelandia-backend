import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { transformValueToNumber } from '../transformers';
import { IsNumber } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ description: 'page number', type: Number })
  @Transform(transformValueToNumber)
  @IsNumber()
  page: number;

  @ApiProperty({ description: 'items limit', type: Number })
  @Transform(transformValueToNumber)
  @IsNumber()
  limit: number;
}

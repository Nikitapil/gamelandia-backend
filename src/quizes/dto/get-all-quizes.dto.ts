import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAllQuizesDto {
  @ApiProperty({ description: 'page number', type: Number })
  @IsNumber({}, { message: 'page must be a number value' })
  @IsOptional()
  page: number;

  @ApiProperty({ description: 'limit per page', type: Number })
  @IsNumber({}, { message: 'limit must be a number value' })
  @IsOptional()
  limit: number;

  @ApiProperty({ description: 'search string', type: Number })
  @IsString({ message: 'search must be a string value' })
  @IsOptional()
  search: string;
}

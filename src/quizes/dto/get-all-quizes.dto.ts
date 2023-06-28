import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetAllQuizesDto {
  @IsNumber({}, { message: 'page must be a number value' })
  @IsOptional()
  page: number;

  @IsNumber({}, { message: 'limit must be a number value' })
  @IsOptional()
  limit: number;

  @IsString({ message: 'search must be a string value' })
  @IsOptional()
  search: string;
}

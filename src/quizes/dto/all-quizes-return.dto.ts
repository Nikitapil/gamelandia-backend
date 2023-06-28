import { TAllQuizesItem } from '../types';
import { ManyQuizesDto } from './many-quizes.dto';

export class AllQuizesReturnDto {
  quizes: ManyQuizesDto[];
  totalCount: number;
}

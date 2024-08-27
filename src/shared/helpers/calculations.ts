import { PaginationDto } from '../dto/PaginationDto';

export const calculateOffset = (dto: PaginationDto) =>
  dto.page * dto.limit - dto.limit;

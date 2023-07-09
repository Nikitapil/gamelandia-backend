import { ApiProperty } from '@nestjs/swagger';

export class ReturnGeneratedQuizDto {
  @ApiProperty({ description: 'quiz id', type: String })
  id: string;
}

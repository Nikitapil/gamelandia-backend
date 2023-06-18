import { ApiProperty } from '@nestjs/swagger';

export class ReturnRestoreKetDto {
  @ApiProperty({
    example: 'success',
    description: 'message about sending key to email'
  })
  message: string;
}

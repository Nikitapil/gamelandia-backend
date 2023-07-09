import { ApiProperty } from '@nestjs/swagger';

export class SuccessMessageDto {
  @ApiProperty({
    example: 'success',
    description: 'message about success in some operations'
  })
  message: 'success';
}

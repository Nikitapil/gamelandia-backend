import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ example: 'success', description: 'Success message' })
  message: 'success';
}

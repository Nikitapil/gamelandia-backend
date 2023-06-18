import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetRestoreKeyDto {
  @ApiProperty({ example: 'test@test.test', description: 'user email' })
  @IsEmail({}, { message: 'Email value is not valid' })
  email: string;
}

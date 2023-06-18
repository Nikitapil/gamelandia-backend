import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestorePasswordDto {
  @ApiProperty({
    example: '1234-5678-90123',
    description: 'User restore key for validate user'
  })
  @IsString({ message: 'Key must be a string value' })
  key: string;

  @ApiProperty({ example: '12345678', description: 'user password' })
  @MinLength(8, { message: 'Password min length is 8' })
  password: string;
}

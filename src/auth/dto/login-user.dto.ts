import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'test@test.tes', description: 'user email' })
  @IsEmail({}, { message: 'Email value is not valid' })
  email: string;

  @ApiProperty({ example: '12345678', description: 'user password' })
  @IsString({ message: 'password must be string value' })
  password: string;
}

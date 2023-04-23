import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'test@test.tes', description: 'user email' })
  @IsEmail({}, { message: 'Email value is not valid' })
  email: string;

  @ApiProperty({ example: '12345678', description: 'user password' })
  @MinLength(8, { message: 'Password min length is 8' })
  password: string;

  @ApiProperty({ example: 'Nick', description: 'user name' })
  @IsString({ message: 'Username must be a string value' })
  username: string;
}

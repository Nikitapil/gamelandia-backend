import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class EditUserDto {
  @ApiProperty({ example: 'test@test.tes', description: 'user email' })
  @IsEmail({}, { message: 'Email value is not valid' })
  @IsOptional()
  email: string;

  @ApiProperty({ example: '12345678', description: 'user password' })
  @MinLength(8, { message: 'Password min length is 8' })
  @IsOptional()
  password: string;

  @ApiProperty({ example: 'Nick', description: 'user name' })
  @IsString({ message: 'Username must be a string value' })
  @IsOptional()
  username: string;
}

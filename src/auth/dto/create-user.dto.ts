import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'test@test.tes',
    description: 'user email',
    type: String
  })
  @IsEmail({}, { message: 'Email value is not valid' })
  email: string;

  @ApiProperty({
    example: '12345678',
    description: 'user password',
    type: String
  })
  @MinLength(8, { message: 'Password min length is 8' })
  password: string;

  @ApiProperty({ example: 'Nick', description: 'username', type: String })
  @IsString({ message: 'Username must be a string value' })
  username: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class EditUserDto {
  @ApiPropertyOptional({
    example: 'test@test.tes',
    description: 'user email',
    type: String
  })
  @IsEmail({}, { message: 'Email value is not valid' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '12345678',
    description: 'user password',
    type: String
  })
  @MinLength(8, { message: 'Password min length is 8' })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'Nick',
    description: 'username',
    type: String
  })
  @IsString({ message: 'Username must be a string value' })
  @IsOptional()
  username?: string;
}

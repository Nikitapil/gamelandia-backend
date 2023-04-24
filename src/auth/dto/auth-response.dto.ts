import { ApiProperty } from '@nestjs/swagger';
import { IReturnUser } from '../types/auth-types';

export class AuthResponseDto {
  @ApiProperty({
    example: 'asdsfdsfdf.dsfasdfasdfsadfsadf.sdfsadfsdf',
    description: 'access token for user validation'
  })
  accessToken: string;

  @ApiProperty({
    example: {
      id: 1,
      email: 'test@test.test',
      username: 'Nick'
    },
    description: 'Object with user data'
  })
  user: IReturnUser;
}

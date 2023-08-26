import { ApiProperty } from '@nestjs/swagger';
import { UserReturnDto } from './user-return.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'asdsfdsfdf.dsfasdfasdfsadfsadf.sdfsadfsdf',
    description: 'access token for user validation',
    type: String
  })
  accessToken: string;

  @ApiProperty({
    description: 'Object with user data',
    type: UserReturnDto
  })
  user: UserReturnDto;
}

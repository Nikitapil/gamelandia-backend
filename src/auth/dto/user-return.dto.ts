import { ApiProperty } from '@nestjs/swagger';

export class UserReturnDto {
  @ApiProperty({ example: 1, description: 'User Id', type: Number })
  id: number;

  @ApiProperty({
    example: 'test@test.test',
    description: 'User email',
    type: String
  })
  email: string;

  @ApiProperty({
    example: 'Test user',
    description: 'username',
    type: String
  })
  username: string;

  @ApiProperty({
    example: 'User',
    description: 'user role',
    type: String,
    enum: ['User', 'Admin']
  })
  role: string;
}

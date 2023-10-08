import { ApiProperty } from '@nestjs/swagger';

export class ReturnUserDto {
  @ApiProperty({ example: 'test@test.tes', description: 'user email' })
  email: string;

  @ApiProperty({ example: 1, description: 'user id' })
  id: number;

  @ApiProperty({ example: 'Nick', description: 'user name' })
  username: string;

  @ApiProperty({
    example: 'User',
    description: 'user role',
    type: String,
    enum: ['User', 'Admin']
  })
  role: 'User' | 'Admin';
}

import { ApiProperty } from '@nestjs/swagger';
import { UserRolesEnum } from '../../domain/common';

export class ReturnUserDto {
  @ApiProperty({
    example: 'test@test.tes',
    description: 'user email',
    type: String
  })
  email: string;

  @ApiProperty({ example: 1, description: 'user id', type: Number })
  id: number;

  @ApiProperty({ example: 'Nick', description: 'user name', type: String })
  username: string;

  @ApiProperty({
    example: 'User',
    description: 'user role',
    type: String,
    enum: UserRolesEnum,
    enumName: 'UserRolesEnum'
  })
  role: UserRolesEnum;
}

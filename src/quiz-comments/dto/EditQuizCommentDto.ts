import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EditQuizCommentDto {
  @ApiProperty({ description: 'comment id', type: String })
  @IsString({ message: 'id should be a string' })
  @IsNotEmpty({ message: 'id should not be empty' })
  id: string;

  @ApiProperty({ description: 'comment text', type: String })
  @IsString({ message: 'text should be a string' })
  @IsNotEmpty({ message: 'text should not be empty' })
  text: string;
}

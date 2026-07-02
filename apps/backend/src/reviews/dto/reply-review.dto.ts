import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyReviewDto {
  @ApiProperty({ maxLength: 2000, description: "The store's public reply to a review" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reply: string;
}

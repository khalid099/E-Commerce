import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Headphones' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Premium noise-cancelling headphones with 30h battery' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 79.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({ description: 'Category UUID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

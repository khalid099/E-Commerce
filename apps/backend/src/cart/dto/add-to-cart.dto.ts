import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'Product UUID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity to add', minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  @ApiPropertyOptional({ description: 'Chosen colour swatch name' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  selectedColor?: string;

  @ApiPropertyOptional({ description: 'Chosen size' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  selectedSize?: string;
}

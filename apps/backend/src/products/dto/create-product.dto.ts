import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  IsArray,
  IsInt,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ProductColorDto {
  @ApiProperty({ example: 'Sand' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @ApiProperty({ example: '#C9B49A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(9)
  hex: string;
}

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

  @ApiPropertyOptional({ example: 99.99, description: 'Original price for sale display' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  compareAtPrice?: number;

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

  @ApiPropertyOptional({ example: 4.8, description: 'Average rating 0–5' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 128 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reviewCount?: number;

  @ApiPropertyOptional({ type: [ProductColorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  colors?: ProductColorDto[];

  @ApiPropertyOptional({ example: ['S', 'M', 'L'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaginatedResponse } from '@ecommerce/shared-types';
import { Product } from './entities/product.entity';
import { QueryProductDto, SortBy } from './dto/query-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async findAll(query: QueryProductDto): Promise<PaginatedResponse<Product>> {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = SortBy.NEWEST,
      page = 1,
      limit = 12,
    } = query;

    const qb = this.productsRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    if (search) {
      qb.andWhere('LOWER(product.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      qb.andWhere('CAST(product.price AS numeric) >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('CAST(product.price AS numeric) <= :maxPrice', { maxPrice });
    }

    switch (sortBy) {
      case SortBy.PRICE_ASC:
        qb.orderBy('CAST(product.price AS numeric)', 'ASC');
        break;
      case SortBy.PRICE_DESC:
        qb.orderBy('CAST(product.price AS numeric)', 'DESC');
        break;
      case SortBy.NEWEST:
      default:
        qb.orderBy('product.createdAt', 'DESC');
    }

    const offset = (page - 1) * limit;
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({
      where: { id, isActive: true },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepo.create(dto);
    return this.productsRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productsRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productsRepo.save(product);
  }
}

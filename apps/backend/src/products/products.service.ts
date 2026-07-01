import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaginatedResponse } from '@ecommerce/shared-types';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
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
      isNew,
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

    if (isNew) {
      qb.andWhere('product.isNew = :isNew', { isNew: true });
    }

    if (minPrice !== undefined) {
      qb.andWhere('CAST(product.price AS numeric) >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('CAST(product.price AS numeric) <= :maxPrice', { maxPrice });
    }

    switch (sortBy) {
      case SortBy.PRICE_ASC:
        qb.orderBy('product.price', 'ASC');
        break;
      case SortBy.PRICE_DESC:
        qb.orderBy('product.price', 'DESC');
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

  /**
   * Admin listing — includes inactive (soft-deleted) products so they can be
   * reviewed and restored. Same search/filter/sort/pagination contract as the
   * public catalog.
   */
  async findAllForAdmin(query: QueryProductDto): Promise<PaginatedResponse<Product>> {
    const {
      search,
      categoryId,
      sortBy = SortBy.NEWEST,
      page = 1,
      limit = 12,
    } = query;

    const qb = this.productsRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      qb.andWhere('LOWER(product.name) LIKE LOWER(:search)', { search: `%${search}%` });
    }
    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    switch (sortBy) {
      case SortBy.PRICE_ASC:
        qb.orderBy('product.price', 'ASC');
        break;
      case SortBy.PRICE_DESC:
        qb.orderBy('product.price', 'DESC');
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

  /** Admin fetch — unlike findOne, returns inactive products too (for editing/restoring). */
  async findOneForAdmin(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.assertCategoryExists(dto.categoryId);
    const product = this.productsRepo.create(dto);
    return this.productsRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOneForAdmin(id);
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }
    Object.assign(product, dto);
    return this.productsRepo.save(product);
  }

  /** Soft delete — preserves the row so historical orders keep referencing it. */
  async remove(id: string): Promise<void> {
    const product = await this.findOneForAdmin(id);
    product.isActive = false;
    await this.productsRepo.save(product);
  }

  async setImageUrl(id: string, imageUrl: string): Promise<Product> {
    const product = await this.findOneForAdmin(id);
    product.imageUrl = imageUrl;
    return this.productsRepo.save(product);
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const count = await this.productsRepo.manager
      .getRepository(Category)
      .countBy({ id: categoryId });
    if (count === 0) throw new NotFoundException(`Category ${categoryId} not found`);
  }
}

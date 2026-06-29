import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug '${dto.slug}' is already taken`);
    return this.categoryRepo.save(this.categoryRepo.create(dto));
  }
}

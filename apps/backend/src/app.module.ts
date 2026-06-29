import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/category.entity';
import { Product } from './products/entities/product.entity';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'ecommerce_db'),
        entities: [User, Category, Product],
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    CategoriesModule,
    ProductsModule,
  ],
})
export class AppModule {}

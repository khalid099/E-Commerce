import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Reviews')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews for a product (paginated)' })
  list(@Param('productId', ParseUUIDPipe) productId: string, @Query() query: QueryReviewDto) {
    return this.reviewsService.listByProduct(productId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Rating summary for a product (average + distribution)' })
  summary(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getSummary(productId);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get the current customer's review for a product (or null)" })
  getMine(@CurrentUser() user: User, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getMine(user.id, productId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a review for a product (one per customer)' })
  create(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user, productId, dto);
  }

  @Patch('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update the current customer's review" })
  updateMine(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateMine(user.id, productId, dto);
  }

  @Delete('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete the current customer's review" })
  deleteMine(@CurrentUser() user: User, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.deleteMine(user.id, productId);
  }
}

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
import { QueryAdminReviewDto } from './dto/query-admin-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

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

  @Get('eligibility')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Whether the current customer may review (delivered order required)' })
  eligibility(@CurrentUser() user: User, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getEligibility(user.id, productId);
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

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class MyReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('mine')
  @ApiOperation({ summary: "List the current customer's own reviews across all products" })
  listMine(@CurrentUser() user: User, @Query() query: QueryReviewDto) {
    return this.reviewsService.listMine(user.id, query);
  }
}

@ApiTags('Admin — Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] List all product reviews (paginated)' })
  list(@Query() query: QueryAdminReviewDto) {
    return this.reviewsService.listAllForAdmin(query);
  }

  @Get('summary')
  @ApiOperation({ summary: '[Admin] Catalogue-wide rating summary (average + distribution)' })
  summary() {
    return this.reviewsService.getAdminSummary();
  }

  @Patch(':id/reply')
  @ApiOperation({ summary: "[Admin] Set or update the store's reply to a review" })
  reply(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplyReviewDto) {
    return this.reviewsService.setReply(id, dto);
  }

  @Delete(':id/reply')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "[Admin] Remove the store's reply from a review" })
  clearReply(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.clearReply(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Remove a review' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.deleteByIdForAdmin(id);
  }
}

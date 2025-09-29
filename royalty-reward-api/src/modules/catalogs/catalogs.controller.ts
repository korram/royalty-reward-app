import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';
import { SearchProductsDto } from './dto/search.dto';
import { LimitOffsetDto } from '../../common/dto/pagination.dto';

@ApiTags('Catalogs')
@Controller({ path: 'catalogs', version: '1' })
export class CatalogsController {
  constructor(private readonly catalogs: CatalogsService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'catalogs' };
  }

  // Admin: Categories
  @Get('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List categories (ADMIN)' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [{ id: 'cid', name: 'Electronics' }], total: 1, limit: 50, offset: 0 } } })
  listCategories(@Query() q: LimitOffsetDto) {
    return this.catalogs.listCategories(q);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create category (ADMIN)' })
  @ApiStdResponses(
    { description: 'Created', schema: { example: { id: 'cid', name: 'Phones', slug: 'phones', path: '/electronics/phones' } } },
    { description: 'Created', schema: { example: { id: 'cid' } } },
  )
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogs.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update category (ADMIN)' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'cid', name: 'Updated' } } })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogs.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category (ADMIN)' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async deleteCategory(@Param('id') id: string) {
    await this.catalogs.deleteCategory(id);
    return {};
  }

  // Admin: Brands
  @Get('brands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List brands (ADMIN)' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [{ id: 'bid', name: 'Apple' }], total: 1, limit: 50, offset: 0 } } })
  listBrands(@Query() q: LimitOffsetDto) {
    return this.catalogs.listBrands(q);
  }

  @Post('brands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create brand (ADMIN)' })
  @ApiStdResponses(
    { description: 'Created', schema: { example: { id: 'bid', name: 'Apple', slug: 'apple' } } },
    { description: 'Created', schema: { example: { id: 'bid' } } },
  )
  createBrand(@Body() dto: CreateBrandDto) {
    return this.catalogs.createBrand(dto);
  }

  @Patch('brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update brand (ADMIN)' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'bid', name: 'New' } } })
  updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.catalogs.updateBrand(id, dto);
  }

  @Delete('brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete brand (ADMIN)' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async deleteBrand(@Param('id') id: string) {
    await this.catalogs.deleteBrand(id);
    return {};
  }

  // Shop-scoped Products
  @Get('shops/:shopId/products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List products (shop-scoped)' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [{ id: 'pid', name: 'iPhone' }], total: 1, limit: 20, offset: 0 } } })
  listProducts(@Param('shopId') shopId: string, @Query() q: LimitOffsetDto) {
    return this.catalogs.listProducts(shopId, q);
  }

  @Post('shops/:shopId/products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.create')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product (shop-scoped)' })
  @ApiStdResponses(
    { description: 'Created', schema: { example: { id: 'pid', shopId: 'sid', name: 'iPhone' } } },
    { description: 'Created', schema: { example: { id: 'pid' } } },
  )
  createProduct(@Param('shopId') shopId: string, @Body() dto: CreateProductDto) {
    return this.catalogs.createProduct(shopId, dto);
  }

  @Get('shops/:shopId/products/:productId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get product (shop-scoped)' })
  @ApiStdResponses({ description: 'Product', schema: { example: { id: 'pid', name: 'iPhone' } } })
  getProduct(@Param('shopId') shopId: string, @Param('productId') productId: string) {
    return this.catalogs.getProduct(shopId, productId);
  }

  @Patch('shops/:shopId/products/:productId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update product (shop-scoped)' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'pid', name: 'New' } } })
  updateProduct(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogs.updateProduct(shopId, productId, dto);
  }

  @Delete('shops/:shopId/products/:productId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.delete')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product (shop-scoped)' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async deleteProduct(@Param('shopId') shopId: string, @Param('productId') productId: string) {
    await this.catalogs.deleteProduct(shopId, productId);
    return {};
  }

  // Variants
  @Get('products/:productId/variants')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List variants' })
  @ApiStdResponses({ description: 'List', schema: { example: [{ id: 'vid', sku: 'IP14-256GB-BLK' }] } })
  listVariants(@Param('productId') productId: string) {
    return this.catalogs.listVariants(productId);
  }

  @Post('products/:productId/variants')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.update')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create variant' })
  @ApiStdResponses(
    { description: 'Created', schema: { example: { id: 'vid', sku: 'IP14-256GB-BLK' } } },
    { description: 'Created', schema: { example: { id: 'vid' } } },
  )
  createVariant(@Param('productId') productId: string, @Body() dto: CreateVariantDto) {
    return this.catalogs.createVariant(productId, dto);
  }

  @Patch('variants/:variantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update variant' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'vid', sku: 'NEW-SKU' } } })
  updateVariant(@Param('variantId') variantId: string, @Body() dto: UpdateVariantDto) {
    return this.catalogs.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.update')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete variant' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async deleteVariant(@Param('variantId') variantId: string) {
    await this.catalogs.deleteVariant(variantId);
    return {};
  }

  // Public search
  @Get('products/search')
  @ApiOperation({ summary: 'Public search products' })
  @ApiStdResponses({ description: 'Search results', schema: { example: { items: [], total: 0, limit: 20, offset: 0 } } })
  searchProducts(@Query() q: SearchProductsDto) {
    return this.catalogs.searchProducts(q);
  }
}

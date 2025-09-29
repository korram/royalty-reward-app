import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';
import { SearchProductsDto } from './dto/search.dto';

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  // Categories (ADMIN)
  async listCategories(params: { limit?: number; offset?: number }) {
    const take = params.limit ?? 50;
    const skip = params.offset ?? 0;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({ take, skip, orderBy: { name: 'asc' } }),
      this.prisma.category.count(),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async createCategory(dto: CreateCategoryDto) {
    const path = await this.computeCategoryPath(dto.slug, dto.parentId);
    return this.prisma.category.create({
      data: { name: dto.name, slug: dto.slug, parentId: dto.parentId, isActive: dto.isActive ?? true, path },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Category not found');

    let nextPath: string | undefined;
    if (dto.slug || dto.parentId !== undefined) {
      nextPath = await this.computeCategoryPath(dto.slug ?? current.slug, dto.parentId ?? current.parentId ?? undefined);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        parentId: dto.parentId,
        isActive: dto.isActive,
        ...(nextPath ? { path: nextPath } : {}),
      },
    });

    // If path changed, update descendants path prefix
    if (nextPath && nextPath !== current.path) {
      const children = await this.prisma.category.findMany({ where: { path: { startsWith: current.path + '/' } } });
      for (const child of children) {
        const newChildPath = child.path.replace(current.path + '/', nextPath + '/');
        await this.prisma.category.update({ where: { id: child.id }, data: { path: newChildPath } });
      }
    }
    return updated;
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  private async computeCategoryPath(slug: string, parentId?: string) {
    if (!parentId) return `/${slug}`;
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent category not found');
    return `${parent.path}/${slug}`;
  }

  // Brands (ADMIN)
  async listBrands(params: { limit?: number; offset?: number }) {
    const take = params.limit ?? 50;
    const skip = params.offset ?? 0;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.brand.findMany({ take, skip, orderBy: { name: 'asc' } }),
      this.prisma.brand.count(),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async createBrand(dto: CreateBrandDto) {
    return this.prisma.brand.create({ data: dto });
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  async deleteBrand(id: string) {
    return this.prisma.brand.delete({ where: { id } });
  }

  // Products (shop-scoped)
  async listProducts(shopId: string, params: { limit?: number; offset?: number }) {
    const take = params.limit ?? 20;
    const skip = params.offset ?? 0;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where: { shopId }, take, skip, orderBy: { name: 'asc' } }),
      this.prisma.product.count({ where: { shopId } }),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async createProduct(shopId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, shopId } });
  }

  async getProduct(shopId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, shopId } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(shopId: string, productId: string, dto: UpdateProductDto) {
    await this.getProduct(shopId, productId);
    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async deleteProduct(shopId: string, productId: string) {
    await this.getProduct(shopId, productId);
    return this.prisma.product.delete({ where: { id: productId } });
  }

  // Variants
  async listVariants(productId: string) {
    return this.prisma.productVariant.findMany({ where: { productId }, orderBy: { sku: 'asc' } });
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    // attrs is non-nullable in Prisma schema; default to {}
    return this.prisma.productVariant.create({
      data: { ...dto, productId, attrs: dto.attrs ?? {} },
    });
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto) {
    return this.prisma.productVariant.update({ where: { id: variantId }, data: dto });
  }

  async deleteVariant(variantId: string) {
    return this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  // Public search
  async searchProducts(q: SearchProductsDto) {
    const where: any = {
      status: q.status ?? 'ACTIVE',
      ...(q.brandId ? { brandId: q.brandId } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' as const } },
              { description: { contains: q.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(q.minPrice || q.maxPrice
        ? {
            variants: {
              some: {
                ...(q.minPrice ? { price: { gte: q.minPrice } } : {}),
                ...(q.maxPrice ? { price: { lte: q.maxPrice } } : {}),
                isActive: true,
              },
            },
          }
        : {}),
    };
    const take = q.limit ?? 20;
    const skip = q.offset ?? 0;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        take,
        skip,
        orderBy: { name: 'asc' },
        include: { media: true },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total, limit: take, offset: skip };
  }
}

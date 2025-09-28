import { PrismaClient, RoleName, ProductStatus } from '@prisma/client';
// import { PrismaClient, RoleName, ProductStatus } from '../generated/prisma';
import * as argon2 from 'argon2';

const prisma = new PrismaClient()

async function main() {
  // --- Create Roles ---
  await prisma.role.createMany({
    data: [
      { name: RoleName.ADMIN },
      { name: RoleName.SHOP_OWNER },
      { name: RoleName.SHOP_STAFF },
      { name: RoleName.CUSTOMER },
    ],
    skipDuplicates: true,
  })

  // --- Create a User ---
  const passwordHash = await argon2.hash('admin1234');
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash,
      status: 'VERIFIED',
    },
  })

  // --- Create a Shop ---
  const shop = await prisma.shop.create({
    data: {
      slug: 'my-shop',
      name: 'My First Shop',
      owner: { connect: { id: user.id } },
      status: 'ACTIVE',
    },
  })

  // --- Create a Product ---
  const product = await prisma.product.create({
    data: {
      shopId: shop.id,
      name: 'T-Shirt',
      slug: 't-shirt',
      description: 'Basic cotton T-shirt',
      status: ProductStatus.ACTIVE,
      ratingAvg: 0,
      ratingCount: 0,
    },
  })

  // --- Create a Product Variant ---
  await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: 'TSHIRT-001',
      price: 299,
      currency: 'THB',
      stockQty: 50,
      attrs: { size: 'M', color: 'Black' },
    },
  })

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

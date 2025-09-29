import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as Prisma from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(params: {
    email: string;
    passwordHash?: string;
    name?: string;
  }) {
    // Ensure CUSTOMER role exists in DB via seed
    const role = await this.prisma.role.findUnique({
      where: { name: Prisma.RoleName.CUSTOMER },
    });
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name,
        roles: role
          ? {
              create: {
                role: { connect: { id: role.id } },
              },
            }
          : undefined,
      },
    });
  }

  async getUserRoleNames(userId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return rows.map((r) => r.role.name);
  }

  async updateMe(userId: string, data: { name?: string; phone?: string; avatar?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
  }

  async createAddress(userId: string, data: {
    label: string; line1: string; line2?: string; district: string; province: string; country: string; postcode: string; isDefault?: boolean;
  }) {
    // If isDefault true, unset others
    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({ data: { ...data, userId } });
  }

  async updateAddress(userId: string, addressId: string, data: Partial<{
    label: string; line1: string; line2?: string; district: string; province: string; country: string; postcode: string; isDefault?: boolean;
  }>) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.update({ where: { id: addressId }, data });
  }

  async deleteAddress(userId: string, addressId: string) {
    // Ensure ownership
    const addr = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!addr || addr.userId !== userId) return null;
    return this.prisma.address.delete({ where: { id: addressId } });
  }
}

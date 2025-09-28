import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RoleName } from '@prisma/client';

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
      where: { name: RoleName.CUSTOMER },
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
}

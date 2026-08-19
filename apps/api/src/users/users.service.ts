import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; email: string; passwordHash: string }) {
    return this.prisma.user.create({ data });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  sanitize(user: { passwordHash: string; [key: string]: unknown }) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}

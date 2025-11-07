import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class AdminPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('admin')
  async getAdmin() {
    return this.prisma.admin.findFirst({
      select: {
        id: true,
        nome: true,
        // @ts-ignore Campo será reconhecido após atualizar o cliente Prisma
        foto_url: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }
}

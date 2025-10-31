import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import * as bcrypt from 'bcryptjs';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        login: true,
        data_criacao: true,
        barber: true,
      },
    });
  }

  @Post()
  @Roles('admin')
  async create(
    @Body() data: { nome: string; login: string; password: string },
  ) {
    const senha_hash = await bcrypt.hash(data.password, 10);
    return this.prisma.admin.create({
      data: {
        nome: data.nome,
        login: data.login,
        senha_hash,
      },
      select: {
        id: true,
        nome: true,
        login: true,
        data_criacao: true,
      },
    });
  }
}

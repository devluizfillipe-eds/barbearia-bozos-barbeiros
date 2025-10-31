import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.service.findMany({
      where: { ativo: true },
      orderBy: { id: 'asc' },
    });
  }

  async update(id: number, updateData: Partial<CreateServiceDto>) {
    return this.prisma.service.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number) {
    return this.prisma.service.delete({
      where: { id },
    });
  }

  async toggleStatus(id: number, ativo: boolean) {
    return this.prisma.service.update({
      where: { id },
      data: { ativo },
    });
  }
}

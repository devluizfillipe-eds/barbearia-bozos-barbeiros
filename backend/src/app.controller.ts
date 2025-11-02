import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHello() {
    const barbersCount = await this.prisma.barber.count();
    return {
      message: 'Barbearia Bozos Barbeiros - API Conectada!',
      database: 'Conexão com PostgreSQL estabelecida',
      barbersCount,
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { EnterQueueDto } from './dto/enter-queue.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('enter')
  async enterQueue(@Body() enterQueueDto: EnterQueueDto) {
    return this.queueService.enterQueue(enterQueueDto);
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard)
  @Get(':barberId')
  async getQueue(@Param('barberId') barberId: string) {
    return this.queueService.getQueue(parseInt(barberId));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':barberId/historico')
  async getHistorico(@Param('barberId') barberId: string) {
    const barber = await this.queueService['prisma'].barber.findUnique({
      where: { id: parseInt(barberId) },
    });
    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Buscar últimos 20 atendimentos finalizados
    const historico = await (this.queueService as any)['prisma'].queue.findMany(
      {
        where: {
          barbeiro_id: parseInt(barberId),
          status: { in: ['ATENDIDO', 'FALTOU', 'DESISTIU'] },
        },
        include: { cliente: true, services: { include: { service: true } } },
        orderBy: { hora_saida: 'desc' },
        take: 20,
      },
    );

    return historico.map((q: any) => ({
      id: q.id,
      cliente: q.cliente,
      barbeiro_id: q.barbeiro_id,
      status: q.status,
      hora_entrada: q.hora_entrada,
      hora_saida: q.hora_saida,
      servicos: (q.services || []).map((qs: any) => ({
        id: qs.service.id,
        nome: qs.service.nome,
        preco: qs.preco_aplicado,
      })),
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.queueService.updateStatus(parseInt(id), updateStatusDto);
  }

  @Get(':id/position')
  async getPosition(@Param('id') id: string) {
    return this.queueService.getPosition(parseInt(id));
  }

  @Get('by-phone/:telefone')
  async getActiveByPhone(@Param('telefone') telefone: string) {
    return this.queueService.getActiveByPhone(telefone);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':barberId/updates')
  async getQueueUpdates(@Param('barberId') barberId: string) {
    const queue = await this.queueService.getQueue(parseInt(barberId));
    return {
      timestamp: new Date().toISOString(),
      queue_length: queue.length,
      queue,
    };
  }
}

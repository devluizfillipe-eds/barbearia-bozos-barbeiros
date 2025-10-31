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
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('enter')
  async enterQueue(@Body() enterQueueDto: EnterQueueDto) {
    return this.queueService.enterQueue(enterQueueDto);
  }

  @Get(':barberId')
  async getQueue(@Param('barberId') barberId: string) {
    return this.queueService.getQueue(parseInt(barberId));
  }

  @Get(':barberId/historico')
  async getHistorico(@Param('barberId') barberId: string) {
    const barber = await this.queueService['prisma'].barber.findUnique({
      where: { id: parseInt(barberId) },
    });
    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Buscar últimos 20 atendimentos finalizados
    const historico = await this.queueService['prisma'].queue.findMany({
      where: {
        barbeiro_id: parseInt(barberId),
        status: { in: ['ATENDIDO', 'FALTOU', 'DESISTIU'] },
      },
      include: { cliente: true },
      orderBy: { hora_saida: 'desc' },
      take: 20,
    });

    return historico;
  }

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

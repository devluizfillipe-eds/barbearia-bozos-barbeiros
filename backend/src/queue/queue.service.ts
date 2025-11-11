import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnterQueueDto } from './dto/enter-queue.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async enterQueue(enterQueueDto: EnterQueueDto) {
    const { nome, telefone, barbeiro_id, serviceIds } = enterQueueDto;

    // Verificar se barbeiro existe
    const barber = await this.prisma.barber.findUnique({
      where: { id: barbeiro_id },
    });
    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Encontrar ou criar usuário
    let user = await this.prisma.user.findUnique({
      where: { telefone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { nome, telefone },
      });
    }

    // Calcular próxima posição na fila
    const lastInQueue = await this.prisma.queue.findFirst({
      where: {
        barbeiro_id,
        status: { in: ['AGUARDANDO', 'ATENDENDO'] },
      },
      orderBy: { posicao: 'desc' },
    });

    const nextPosition = lastInQueue ? lastInQueue.posicao + 1 : 1;

    // Entrar na fila
    const queueEntry = await this.prisma.queue.create({
      data: {
        cliente_id: user.id,
        barbeiro_id,
        posicao: nextPosition,
        status: 'AGUARDANDO',
      },
      include: {
        cliente: true,
        barbeiro: true,
      },
    });

    // Persistir serviços selecionados (se houver)
    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, preco: true, tempo_estimado: true },
      });
      if (services.length > 0) {
        await (this.prisma as any).queueService.createMany({
          data: services.map((s) => ({
            queue_id: queueEntry.id,
            service_id: s.id,
            preco_aplicado: s.preco ?? null,
            tempo_estimado_aplicado: s.tempo_estimado ?? null,
          })),
        });
      }
    }

    // Log da ação
    await this.prisma.log.create({
      data: {
        acao: 'CLIENTE_ENTROU_NA_FILA',
        detalhes: `Cliente ${user.nome} entrou na fila do barbeiro ${barber.nome}`,
        usuario_id: user.id,
        usuario_tipo: 'cliente',
      },
    });

    // Recarregar com serviços agregados
    const full = await (this.prisma as any).queue.findUnique({
      where: { id: queueEntry.id },
      include: {
        cliente: true,
        barbeiro: true,
        services: { include: { service: true } },
      },
    });

    const f: any = full;
    return {
      id: f.id,
      posicao: f.posicao,
      cliente: f.cliente,
      barbeiro: f.barbeiro,
      hora_entrada: f.hora_entrada,
      servicos: (f.services || []).map((qs: any) => ({
        id: qs.service.id,
        nome: qs.service.nome,
        preco: qs.preco_aplicado,
      })),
    };
  }

  async getQueue(barberId: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });
    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    const queue = await (this.prisma as any).queue.findMany({
      where: {
        barbeiro_id: barberId,
        status: { in: ['AGUARDANDO', 'ATENDENDO'] },
      },
      include: { cliente: true, services: { include: { service: true } } },
      orderBy: { posicao: 'asc' },
    });

    return (queue as any).map((q: any) => ({
      id: q.id,
      posicao: q.posicao,
      cliente: q.cliente,
      hora_entrada: q.hora_entrada,
      status: q.status,
      servicos: (q.services || []).map((qs: any) => ({
        id: qs.service.id,
        nome: qs.service.nome,
        preco: qs.preco_aplicado,
      })),
    }));
  }

  async updateStatus(queueId: number, updateStatusDto: UpdateStatusDto) {
    const queueEntry = await (this.prisma as any).queue.findUnique({
      where: { id: queueId },
      include: {
        cliente: true,
        barbeiro: true,
        services: { include: { service: true } },
      },
    });

    if (!queueEntry) {
      throw new NotFoundException('Entrada da fila não encontrada');
    }

    const updatedQueue = await this.prisma.queue.update({
      where: { id: queueId },
      data: {
        status: updateStatusDto.status,
        hora_saida: updateStatusDto.status !== 'ATENDENDO' ? new Date() : null,
      },
      include: { cliente: true },
    });

    // Log da ação
    await this.prisma.log.create({
      data: {
        acao: `STATUS_ATUALIZADO_${updateStatusDto.status}`,
        detalhes: `Cliente ${queueEntry.cliente.nome} marcado como ${updateStatusDto.status}`,
        usuario_id: queueEntry.barbeiro_id,
        usuario_tipo: 'barbeiro',
      },
    });

    return updatedQueue;
  }

  async getPosition(queueId: number) {
    const queueEntry = await (this.prisma as any).queue.findUnique({
      where: { id: queueId },
      include: {
        cliente: true,
        barbeiro: true,
        services: { include: { service: true } },
      },
    });

    if (!queueEntry) {
      throw new NotFoundException('Entrada da fila não encontrada');
    }

    const queueAhead = await this.prisma.queue.count({
      where: {
        barbeiro_id: queueEntry.barbeiro_id,
        status: { in: ['AGUARDANDO', 'ATENDENDO'] },
        posicao: { lt: queueEntry.posicao },
      },
    });

    const qe: any = queueEntry;
    return {
      id: qe.id,
      cliente: qe.cliente,
      barbeiro: qe.barbeiro,
      posicao: qe.posicao,
      pessoas_na_frente: queueAhead,
      status: qe.status,
      hora_entrada: qe.hora_entrada,
      servicos: (qe.services || []).map((qs: any) => ({
        id: qs.service.id,
        nome: qs.service.nome,
        preco: qs.preco_aplicado,
      })),
    };
  }

  async getActiveByPhone(telefone: string) {
    const user = await this.prisma.user.findUnique({ where: { telefone } });
    if (!user) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const activeEntry = await (this.prisma as any).queue.findFirst({
      where: {
        cliente_id: user.id,
        status: { in: ['AGUARDANDO', 'ATENDENDO'] },
      },
      include: {
        cliente: true,
        barbeiro: true,
        services: { include: { service: true } },
      },
      orderBy: { hora_entrada: 'desc' },
    });

    if (!activeEntry) {
      throw new NotFoundException('Nenhuma fila ativa para este telefone');
    }

    const queueAhead = await this.prisma.queue.count({
      where: {
        barbeiro_id: activeEntry.barbeiro_id,
        status: { in: ['AGUARDANDO', 'ATENDENDO'] },
        posicao: { lt: activeEntry.posicao },
      },
    });

    const ae: any = activeEntry;
    return {
      id: ae.id,
      cliente: ae.cliente,
      barbeiro: ae.barbeiro,
      posicao: ae.posicao,
      pessoas_na_frente: queueAhead,
      status: ae.status,
      hora_entrada: ae.hora_entrada,
      servicos: (ae.services || []).map((qs: any) => ({
        id: qs.service.id,
        nome: qs.service.nome,
        preco: qs.preco_aplicado,
      })),
    };
  }
}

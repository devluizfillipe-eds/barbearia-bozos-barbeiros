import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EnterQueueDto } from "./dto/enter-queue.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async enterQueue(enterQueueDto: EnterQueueDto) {
    const { nome, telefone, barbeiro_id } = enterQueueDto;

    // Verificar se barbeiro existe
    const barber = await this.prisma.barber.findUnique({
      where: { id: barbeiro_id },
    });
    if (!barber) {
      throw new NotFoundException("Barbeiro não encontrado");
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
        status: { in: ["AGUARDANDO", "ATENDENDO"] },
      },
      orderBy: { posicao: "desc" },
    });

    const nextPosition = lastInQueue ? lastInQueue.posicao + 1 : 1;

    // Entrar na fila
    const queueEntry = await this.prisma.queue.create({
      data: {
        cliente_id: user.id,
        barbeiro_id,
        posicao: nextPosition,
        status: "AGUARDANDO",
      },
      include: {
        cliente: true,
        barbeiro: true,
      },
    });

    // Log da ação
    await this.prisma.log.create({
      data: {
        acao: "CLIENTE_ENTROU_NA_FILA",
        detalhes: `Cliente ${user.nome} entrou na fila do barbeiro ${barber.nome}`,
        usuario_id: user.id,
        usuario_tipo: "cliente",
      },
    });

    return {
      id: queueEntry.id,
      posicao: queueEntry.posicao,
      cliente: queueEntry.cliente,
      barbeiro: queueEntry.barbeiro,
      hora_entrada: queueEntry.hora_entrada,
    };
  }

  async getQueue(barberId: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });
    if (!barber) {
      throw new NotFoundException("Barbeiro não encontrado");
    }

    const queue = await this.prisma.queue.findMany({
      where: {
        barbeiro_id: barberId,
        status: { in: ["AGUARDANDO", "ATENDENDO"] },
      },
      include: { cliente: true },
      orderBy: { posicao: "asc" },
    });

    return queue;
  }

  async updateStatus(queueId: number, updateStatusDto: UpdateStatusDto) {
    const queueEntry = await this.prisma.queue.findUnique({
      where: { id: queueId },
      include: { cliente: true, barbeiro: true },
    });

    if (!queueEntry) {
      throw new NotFoundException("Entrada da fila não encontrada");
    }

    const updatedQueue = await this.prisma.queue.update({
      where: { id: queueId },
      data: {
        status: updateStatusDto.status,
        hora_saida: updateStatusDto.status !== "ATENDENDO" ? new Date() : null,
      },
      include: { cliente: true },
    });

    // Log da ação
    await this.prisma.log.create({
      data: {
        acao: `STATUS_ATUALIZADO_${updateStatusDto.status}`,
        detalhes: `Cliente ${queueEntry.cliente.nome} marcado como ${updateStatusDto.status}`,
        usuario_id: queueEntry.barbeiro_id,
        usuario_tipo: "barbeiro",
      },
    });

    return updatedQueue;
  }

  async getPosition(queueId: number) {
    const queueEntry = await this.prisma.queue.findUnique({
      where: { id: queueId },
      include: { cliente: true, barbeiro: true },
    });

    if (!queueEntry) {
      throw new NotFoundException("Entrada da fila não encontrada");
    }

    const queueAhead = await this.prisma.queue.count({
      where: {
        barbeiro_id: queueEntry.barbeiro_id,
        status: { in: ["AGUARDANDO", "ATENDENDO"] },
        posicao: { lt: queueEntry.posicao },
      },
    });

    return {
      id: queueEntry.id,
      cliente: queueEntry.cliente,
      barbeiro: queueEntry.barbeiro,
      posicao: queueEntry.posicao,
      pessoas_na_frente: queueAhead,
      status: queueEntry.status,
      hora_entrada: queueEntry.hora_entrada,
    };
  }
}

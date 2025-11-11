import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(startDate?: string, endDate?: string, barberId?: string) {
    // Normalizar datas para início e fim do dia em horário local
    const start = startDate
      ? new Date(`${startDate}T00:00:00`)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : new Date();
    const barberFilterId = barberId ? parseInt(barberId) : undefined;

    // Fila atendida no período (com serviços vinculados)
    // Importante: filtrar por hora_saida (conclusão) para refletir faturamento/serviços concluídos no período
    const attendedQueues = await (this.prisma as any).queue.findMany({
      where: {
        status: 'ATENDIDO',
        hora_saida: { gte: start, lte: end },
        ...(barberFilterId ? { barbeiro_id: barberFilterId } : {}),
      },
      include: {
        cliente: true,
        barbeiro: true,
        services: { include: { service: true } },
      },
    });

    // Carregar barbeiros base (inclui admin se ele possuir um registro Barber associado)
    const baseBarbers = await this.prisma.barber.findMany({
      where: barberFilterId ? { id: barberFilterId } : { ativo: true },
      select: { id: true, nome: true },
    });

    // Total de clientes únicos
    const uniqueClientIds = new Set<number>(
      attendedQueues.map((q: any) => q.cliente_id),
    );
    const totalClients = uniqueClientIds.size;

    // Flatten de todos os serviços realizados
    const allQueueServices = attendedQueues.flatMap((q: any) => q.services);
    const totalServices = allQueueServices.length;

    // Receita real: soma dos preços aplicados
    const totalRevenue = allQueueServices.reduce(
      (sum: number, qs: any) => sum + (qs.preco_aplicado || 0),
      0,
    );

    // Tempo médio de atendimento/espera: diferença entre hora_entrada e hora_saida
    // Filtrar outliers (<=0 ou > 10h) para evitar distorções acidentais
    const durations: number[] = attendedQueues
      .filter((q: any) => q.hora_saida)
      .map(
        (q: any) =>
          (new Date(q.hora_saida).getTime() -
            new Date(q.hora_entrada).getTime()) /
          60000,
      )
      .filter((m) => m > 0 && m <= 600);
    const averageWaitTime = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    // Serviços por barbeiro (incluindo aqueles sem atendimentos no período)
    const servicesByBarberMap = new Map<
      number,
      {
        barberId: number;
        barberName: string;
        totalServices: number;
        revenue: number;
      }
    >();

    // Inicializar todos barbeiros com zero
    baseBarbers.forEach((b) => {
      servicesByBarberMap.set(b.id, {
        barberId: b.id,
        barberName: b.nome,
        totalServices: 0,
        revenue: 0,
      });
    });

    // Acumular métricas dos atendimentos
    attendedQueues.forEach((q: any) => {
      const existing = servicesByBarberMap.get(q.barbeiro_id);
      if (!existing) {
        // Caso raro: barbeiro não estava ativo, mas teve atendimentos
        servicesByBarberMap.set(q.barbeiro_id, {
          barberId: q.barbeiro_id,
          barberName: (q as any).barbeiro?.nome || '',
          totalServices: q.services.length,
          revenue: q.services.reduce(
            (s: number, qs: any) => s + (qs.preco_aplicado || 0),
            0,
          ),
        });
      } else {
        existing.totalServices += q.services.length;
        existing.revenue += q.services.reduce(
          (s: number, qs: any) => s + (qs.preco_aplicado || 0),
          0,
        );
      }
    });

    // Ordenar por faturamento desc
    const servicesByBarber = Array.from(servicesByBarberMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    // Serviços populares (contagem + receita)
    const popularMap = new Map<
      number,
      { serviceId: number; serviceName: string; count: number; revenue: number }
    >();
    allQueueServices.forEach((qs: any) => {
      const existing = popularMap.get(qs.service_id) || {
        serviceId: qs.service_id,
        serviceName: qs.service?.nome || '',
        count: 0,
        revenue: 0,
      };
      existing.count += 1;
      existing.revenue += qs.preco_aplicado || 0;
      popularMap.set(qs.service_id, existing);
    });
    const popularServices = Array.from(popularMap.values()).sort(
      (a, b) => b.count - a.count,
    );

    return {
      totalClients,
      totalServices,
      totalRevenue,
      averageWaitTime,
      servicesByBarber,
      popularServices,
    };
  }
}

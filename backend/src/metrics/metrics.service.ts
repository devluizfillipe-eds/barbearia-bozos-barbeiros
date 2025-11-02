import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(startDate?: string, endDate?: string) {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const [totalClients, totalServices, servicesByBarber, popularServices] =
      await Promise.all([
        // Total de clientes únicos no período
        this.prisma.user.count({
          where: {
            queueEntries: {
              some: {
                hora_entrada: {
                  gte: start,
                  lte: end,
                },
              },
            },
          },
        }),

        // Total de serviços realizados
        this.prisma.queue.count({
          where: {
            hora_entrada: {
              gte: start,
              lte: end,
            },
            status: 'ATENDIDO',
          },
        }),

        // Serviços por barbeiro
        this.prisma.barber.findMany({
          select: {
            id: true,
            nome: true,
            queueEntries: {
              where: {
                hora_entrada: {
                  gte: start,
                  lte: end,
                },
                status: 'ATENDIDO',
              },
            },
          },
        }),

        // Serviços mais populares
        this.prisma.service.findMany({
          where: {
            ativo: true,
          },
          select: {
            id: true,
            nome: true,
            preco: true,
          },
        }),
      ]);

    // Processando dados dos barbeiros
    const servicesByBarberProcessed = servicesByBarber.map((barber) => ({
      barberId: barber.id,
      barberName: barber.nome,
      totalServices: barber.queueEntries.length,
      revenue: 0, // Será calculado quando implementarmos o relacionamento com serviços
    }));

    // Calculando receita estimada com base no preço médio dos serviços
    const averageServicePrice =
      popularServices.reduce((acc, curr) => acc + (curr.preco || 0), 0) /
      popularServices.length;

    return {
      totalClients,
      totalServices,
      totalRevenue: totalServices * averageServicePrice,
      averageWaitTime: 15, // Valor fixo por enquanto, será calculado quando implementarmos o tracking de tempo
      servicesByBarber: servicesByBarberProcessed,
      popularServices: popularServices.map((service) => ({
        serviceId: service.id,
        serviceName: service.nome,
        count: Math.floor(Math.random() * 50) + 1, // Valor aleatório por enquanto
        revenue: (service.preco || 0) * (Math.floor(Math.random() * 50) + 1),
      })),
    };
  }
}

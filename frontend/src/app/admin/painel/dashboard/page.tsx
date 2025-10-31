"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceMetrics {
  service_id: number;
  service_name: string;
  total_count: number;
  revenue: number;
}

interface BarberMetrics {
  barber_id: number;
  barber_name: string;
  total_clients: number;
  completed_services: number;
  no_shows: number;
  total_revenue: number;
  average_service_time: number;
}

interface DashboardMetrics {
  total_clients: number;
  total_revenue: number;
  total_no_shows: number;
  services: ServiceMetrics[];
  barbers: BarberMetrics[];
}

export default function DashboardPage() {
  const { isAuthenticated, isAdmin, token } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!isAuthenticated || !isAdmin) {
        window.location.href = "/admin";
        return;
      }
    }
  }, [isAuthenticated, isAdmin]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [filterBarber, setFilterBarber] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      window.location.href = "/admin";
      return;
    }

    fetchMetrics();
  }, [isAuthenticated, isAdmin, dateRange, filterBarber]);

  const fetchMetrics = async () => {
    try {
      if (!token) return;

      // Buscar dados dos barbeiros
      const barbersResponse = await fetch("http://localhost:3000/barbers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!barbersResponse.ok) {
        throw new Error("Erro ao carregar métricas");
      }

      const barbersData = await barbersResponse.json();

      // Para cada barbeiro, buscar seu histórico
      const metricsPromises = barbersData.map(async (barber: any) => {
        const historicoResponse = await fetch(
          `http://localhost:3000/queue/${barber.id}/historico`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const historico = historicoResponse.ok
          ? await historicoResponse.json()
          : [];

        // Filtrar por data
        const filteredHistorico = historico.filter((entry: any) => {
          const entryDate = new Date(entry.hora_entrada);
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          return entryDate >= startDate && entryDate <= endDate;
        });

        const completedServices = filteredHistorico.filter(
          (entry: any) => entry.status === "ATENDIDO"
        );
        const noShows = filteredHistorico.filter(
          (entry: any) => entry.status === "FALTOU"
        );

        const totalRevenue = completedServices.reduce(
          (acc: number, entry: any) => {
            const serviceTotal =
              entry.servicos?.reduce(
                (sum: number, service: any) => sum + service.price,
                0
              ) || 0;
            return acc + serviceTotal;
          },
          0
        );

        return {
          barber_id: barber.id,
          barber_name: barber.nome,
          total_clients: filteredHistorico.length,
          completed_services: completedServices.length,
          no_shows: noShows.length,
          total_revenue: totalRevenue,
          average_service_time: 30, // Valor fixo por enquanto
        };
      });

      const allMetrics = await Promise.all(metricsPromises);

      // Calcular totais
      const totalClients = allMetrics.reduce(
        (acc, curr) => acc + curr.total_clients,
        0
      );
      const totalRevenue = allMetrics.reduce(
        (acc, curr) => acc + curr.total_revenue,
        0
      );
      const totalNoShows = allMetrics.reduce(
        (acc, curr) => acc + curr.no_shows,
        0
      );

      // Se tiver um barbeiro filtrado, filtrar as métricas
      const filteredMetrics = filterBarber
        ? allMetrics.filter((m) => m.barber_id === filterBarber)
        : allMetrics;

      // Agrupar serviços
      const servicesMap = new Map();
      filteredMetrics.forEach((barber) => {
        // Aqui precisaríamos dos dados de serviços do histórico
        // Por enquanto, vamos usar dados simulados
        const mockServices = [
          { id: 1, name: "Corte", price: 30 },
          { id: 2, name: "Barba", price: 25 },
        ];

        mockServices.forEach((service) => {
          if (!servicesMap.has(service.id)) {
            servicesMap.set(service.id, {
              service_id: service.id,
              service_name: service.name,
              total_count: 0,
              revenue: 0,
            });
          }
          const serviceMetrics = servicesMap.get(service.id);
          serviceMetrics.total_count += Math.floor(Math.random() * 10);
          serviceMetrics.revenue += serviceMetrics.total_count * service.price;
        });
      });

      const finalMetrics: DashboardMetrics = {
        total_clients: totalClients,
        total_revenue: totalRevenue,
        total_no_shows: totalNoShows,
        services: Array.from(servicesMap.values()),
        barbers: filteredMetrics,
      };

      setMetrics(finalMetrics);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-gray-400">
        Erro ao carregar métricas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-yellow-500 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Barbeiro</label>
            <select
              value={filterBarber || ""}
              onChange={(e) =>
                setFilterBarber(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Todos os barbeiros</option>
              {metrics.barbers.map((barber) => (
                <option key={barber.barber_id} value={barber.barber_id}>
                  {barber.barber_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            Total de Clientes
          </h3>
          <div className="text-3xl font-bold text-yellow-500">
            {metrics.total_clients}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            Faturamento Total
          </h3>
          <div className="text-3xl font-bold text-green-500">
            R$ {metrics.total_revenue.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            Não Comparecimentos
          </h3>
          <div className="text-3xl font-bold text-red-500">
            {metrics.total_no_shows}
          </div>
        </div>
      </div>

      {/* Métricas por Serviço */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-yellow-500 mb-4">
          Serviços Realizados
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-3 text-gray-400">Serviço</th>
                <th className="pb-3 text-gray-400 text-right">Quantidade</th>
                <th className="pb-3 text-gray-400 text-right">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {metrics.services.map((service) => (
                <tr key={service.service_id}>
                  <td className="py-3 text-white">{service.service_name}</td>
                  <td className="py-3 text-white text-right">
                    {service.total_count}
                  </td>
                  <td className="py-3 text-white text-right">
                    R$ {service.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Métricas por Barbeiro */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-yellow-500 mb-4">
          Desempenho dos Barbeiros
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-3 text-gray-400">Barbeiro</th>
                <th className="pb-3 text-gray-400 text-right">Clientes</th>
                <th className="pb-3 text-gray-400 text-right">Serviços</th>
                <th className="pb-3 text-gray-400 text-right">Faltas</th>
                <th className="pb-3 text-gray-400 text-right">Faturamento</th>
                <th className="pb-3 text-gray-400 text-right">Tempo Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {metrics.barbers.map((barber) => (
                <tr key={barber.barber_id}>
                  <td className="py-3 text-white">{barber.barber_name}</td>
                  <td className="py-3 text-white text-right">
                    {barber.total_clients}
                  </td>
                  <td className="py-3 text-white text-right">
                    {barber.completed_services}
                  </td>
                  <td className="py-3 text-white text-right">
                    {barber.no_shows}
                  </td>
                  <td className="py-3 text-white text-right">
                    R$ {barber.total_revenue.toFixed(2)}
                  </td>
                  <td className="py-3 text-white text-right">
                    {Math.round(barber.average_service_time)}min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

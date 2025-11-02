"use client";

import { useEffect, useState } from "react";

interface DashboardMetrics {
  totalClients: number;
  totalRevenue: number;
  totalServices: number;
  averageWaitTime: number;
  servicesByBarber: {
    barberId: string;
    barberName: string;
    totalServices: number;
    revenue: number;
  }[];
  popularServices: {
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }[];
}

export default function DashboardAdmin() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/metrics?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Falha ao carregar métricas");

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError("Erro ao carregar métricas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtros de Data */}
      <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-[#f2b63a] mb-4">
          Filtrar por Período
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
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
              className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
            />
          </div>
        </div>
      </div>

      {metrics && (
        <>
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400">
                Total de Clientes
              </h3>
              <p className="text-3xl font-bold text-[#f2b63a] mt-2">
                {metrics.totalClients}
              </p>
            </div>
            <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400">
                Faturamento Total
              </h3>
              <p className="text-3xl font-bold text-green-400 mt-2">
                R$ {metrics.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400">
                Total de Serviços
              </h3>
              <p className="text-3xl font-bold text-blue-400 mt-2">
                {metrics.totalServices}
              </p>
            </div>
            <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400">
                Tempo Médio de Espera
              </h3>
              <p className="text-3xl font-bold text-purple-400 mt-2">
                {metrics.averageWaitTime}min
              </p>
            </div>
          </div>

          {/* Métricas por Barbeiro */}
          <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
              Desempenho por Barbeiro
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-3 text-gray-400">Barbeiro</th>
                    <th className="pb-3 text-gray-400 text-right">
                      Total Serviços
                    </th>
                    <th className="pb-3 text-gray-400 text-right">
                      Faturamento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {metrics.servicesByBarber.map((barber) => (
                    <tr key={barber.barberId}>
                      <td className="py-3 text-white">{barber.barberName}</td>
                      <td className="py-3 text-white text-right">
                        {barber.totalServices}
                      </td>
                      <td className="py-3 text-white text-right">
                        R$ {barber.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Serviços Populares */}
          <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
              Serviços Mais Populares
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-3 text-gray-400">Serviço</th>
                    <th className="pb-3 text-gray-400 text-right">
                      Quantidade
                    </th>
                    <th className="pb-3 text-gray-400 text-right">
                      Faturamento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {metrics.popularServices.map((service) => (
                    <tr key={service.serviceId}>
                      <td className="py-3 text-white">{service.serviceName}</td>
                      <td className="py-3 text-white text-right">
                        {service.count}
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
        </>
      )}
    </div>
  );
}

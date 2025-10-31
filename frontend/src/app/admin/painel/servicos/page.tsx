"use client";

import { useEffect, useState } from "react";

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  active: boolean;
}

export default function ServicosAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration: "",
  });

  useEffect(() => {
    // Dados mockados enquanto o backend não está disponível
    const mockServices = [
      { id: 1, name: "Corte", price: 30, duration: 25, active: true },
      { id: 2, name: "Barba", price: 30, duration: 15, active: true },
      { id: 3, name: "Sobrancelha", price: 10, duration: 10, active: true },
      { id: 4, name: "Pézinho", price: 10, duration: 5, active: true },
      { id: 5, name: "Tintura", price: 20, duration: 30, active: true },
      { id: 6, name: "Tintura Barba", price: 20, duration: 15, active: true },
      { id: 7, name: "Textura", price: 50, duration: 40, active: true },
      { id: 8, name: "Alisante", price: 40, duration: 35, active: true },
      { id: 9, name: "Luzes", price: 60, duration: 60, active: true },
      { id: 10, name: "Descolorir", price: 70, duration: 90, active: true },
    ];
    setServices(mockServices);
    setLoading(false);
  }, []);

  const handleAddService = () => {
    try {
      // Simular adição do serviço localmente
      const newServiceObj = {
        id: services.length + 1,
        name: newService.name,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration),
        active: true,
      };
      setServices([...services, newServiceObj]);
      setNewService({ name: "", price: "", duration: "" });
      setShowAddModal(false);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao adicionar serviço");
    }
  };

  const toggleServiceStatus = (serviceId: number, active: boolean) => {
    // Simular atualização do status
    const updatedServices = services.map((s) =>
      s.id === serviceId ? { ...s, active: active } : s
    );
    setServices(updatedServices);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">
          Gestão de Serviços
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Adicionar Serviço
        </button>
      </div>

      {/* Lista de Serviços */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="px-6 py-4 text-gray-400">Nome</th>
                <th className="px-6 py-4 text-gray-400">Preço</th>
                <th className="px-6 py-4 text-gray-400">Duração</th>
                <th className="px-6 py-4 text-gray-400">Status</th>
                <th className="px-6 py-4 text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="px-6 py-4 text-white">{service.name}</td>
                  <td className="px-6 py-4 text-white">
                    R$ {service.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {service.duration} min
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        service.active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {service.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        toggleServiceStatus(service.id, !service.active)
                      }
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        service.active
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {service.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Serviço */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Adicionar Serviço</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService({ ...newService, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService({ ...newService, price: e.target.value })
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={newService.duration}
                  onChange={(e) =>
                    setNewService({ ...newService, duration: e.target.value })
                  }
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddService}
                disabled={
                  !newService.name || !newService.price || !newService.duration
                }
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

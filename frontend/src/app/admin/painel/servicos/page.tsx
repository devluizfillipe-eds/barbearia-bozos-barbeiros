"use client";

import { useEffect, useState } from "react";

interface Service {
  id: string;
  nome: string;
  preco: number;
  tempo_estimado: number;
  ativo: boolean;
}

export default function ServicosAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration: "",
  });
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("http://localhost:3000/services", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) throw new Error("Falha ao carregar serviços");

      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError("Erro ao carregar lista de serviços");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          nome: newService.name,
          preco: parseFloat(newService.price),
          tempo_estimado: parseInt(newService.duration),
          ativo: true,
        }),
      });

      if (!response.ok) throw new Error("Falha ao adicionar serviço");

      setNewService({ name: "", price: "", duration: "" });
      fetchServices();
    } catch (err) {
      setError("Erro ao adicionar serviço");
      console.error(err);
    }
  };

  const toggleServiceStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/services/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ ativo: !currentStatus }),
      });

      if (!response.ok) throw new Error("Falha ao atualizar status do serviço");

      fetchServices();
    } catch (err) {
      setError("Erro ao atualizar status do serviço");
      console.error(err);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const response = await fetch(
        `http://localhost:3000/services/${editingService.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            nome: editingService.nome,
            preco: editingService.preco,
            tempo_estimado: editingService.tempo_estimado,
          }),
        }
      );

      if (!response.ok) throw new Error("Falha ao atualizar serviço");

      setEditingService(null);
      fetchServices();
    } catch (err) {
      setError("Erro ao atualizar serviço");
      console.error(err);
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

      {/* Adicionar Serviço (mobile-first) */}
      <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
          Adicionar Novo Serviço
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Nome</label>
            <input
              type="text"
              value={newService.name}
              onChange={(e) =>
                setNewService({ ...newService, name: e.target.value })
              }
              placeholder="Nome do serviço"
              className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Preço (R$)</label>
            <input
              type="number"
              value={newService.price}
              onChange={(e) =>
                setNewService({ ...newService, price: e.target.value })
              }
              placeholder="0,00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Duração (minutos)</label>
            <input
              type="number"
              value={newService.duration}
              onChange={(e) =>
                setNewService({ ...newService, duration: e.target.value })
              }
              placeholder="Ex: 30"
              min="1"
              className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
              required
            />
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-[#f2b63a] text-[#2e2d37] font-semibold rounded-lg hover:brightness-110 transition-all text-sm"
            >
              Adicionar Serviço
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Serviços (mobile-first cards) */}
      <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
          Serviços Disponíveis
        </h2>
        {services.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">
            Nenhum serviço cadastrado.
          </div>
        )}
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="p-4 bg-[#2e2d37] rounded-lg border border-[#4b4950]/30 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <h3 className="font-medium text-white text-base">
                  {service.nome}
                </h3>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-gray-500">Preço:</span> R${" "}
                    {service.preco.toFixed(2)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-gray-500">Duração:</span>{" "}
                    {service.tempo_estimado} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        service.ativo
                          ? "bg-green-900/20 text-green-400 border border-green-500/20"
                          : "bg-red-900/20 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {service.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
                <button
                  onClick={() => setEditingService(service)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#f2b63a] text-[#2e2d37] font-semibold rounded-lg hover:brightness-110 transition-colors text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleServiceStatus(service.id, service.ativo)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#4b4950] text-white rounded-lg hover:bg-[#3d3b42] transition-colors text-sm"
                >
                  {service.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Edição */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#26242d] p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-[#f2b63a] mb-4">
              Editar Serviço
            </h3>
            <form onSubmit={handleUpdateService} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Nome do serviço
                </label>
                <input
                  type="text"
                  value={editingService.nome}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      nome: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  value={editingService.preco}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      preco: parseFloat(e.target.value),
                    })
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={editingService.tempo_estimado}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      tempo_estimado: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 px-4 py-2 bg-[#4b4950] text-white rounded-lg hover:bg-[#3d3b42] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#f2b63a] text-[#2e2d37] font-semibold rounded-lg hover:brightness-110 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

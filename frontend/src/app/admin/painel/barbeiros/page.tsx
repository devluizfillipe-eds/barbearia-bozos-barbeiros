"use client";

import { useEffect, useState } from "react";

interface Barber {
  id: string;
  nome: string;
  login: string;
  disponivel: boolean;
}

export default function BarbeirosAdmin() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [newBarber, setNewBarber] = useState({
    nome: "",
    login: "",
    senha: "",
  });
  const [editForm, setEditForm] = useState({
    nome: "",
    senha: "",
  });

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const response = await fetch("http://localhost:3000/barbers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Falha ao carregar barbeiros");

      const data = await response.json();
      setBarbers(data);
    } catch (err) {
      setError("Erro ao carregar lista de barbeiros");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/barbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          nome: newBarber.nome,
          login: newBarber.login,
          senha: newBarber.senha,
          disponivel: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao adicionar barbeiro");
      }

      setNewBarber({ nome: "", login: "", senha: "" });
      fetchBarbers();
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar barbeiro");
      console.error(err);
    }
  };

  const toggleBarberStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/barbers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ disponivel: !currentStatus }),
      });

      if (!response.ok)
        throw new Error("Falha ao atualizar status do barbeiro");

      fetchBarbers();
    } catch (err) {
      setError("Erro ao atualizar status do barbeiro");
      console.error(err);
    }
  };

  const deleteBarber = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o barbeiro "${name}"?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/barbers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Falha ao remover barbeiro");
      }

      fetchBarbers();
    } catch (err: any) {
      setError(err.message || "Erro ao remover barbeiro");
      console.error(err);
    }
  };

  const startEditing = (barber: Barber) => {
    setEditingBarber(barber.id);
    setEditForm({
      nome: barber.nome,
      senha: "",
    });
  };

  const handleEdit = async (barberId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/barbers/${barberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            nome: editForm.nome,
            ...(editForm.senha ? { senha: editForm.senha } : {}),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao editar barbeiro");
      }

      setEditingBarber(null);
      setEditForm({ nome: "", senha: "" });
      fetchBarbers();
    } catch (err: any) {
      setError(err.message || "Erro ao editar barbeiro");
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

      {/* Adicionar Barbeiro (mobile-first: campos empilhados) */}
      <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
          Adicionar Novo Barbeiro
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Nome</label>
            <input
              type="text"
              value={newBarber.nome}
              onChange={(e) =>
                setNewBarber({ ...newBarber, nome: e.target.value })
              }
              placeholder="Nome do barbeiro"
              className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Login</label>
            <input
              type="text"
              value={newBarber.login}
              onChange={(e) =>
                setNewBarber({ ...newBarber, login: e.target.value })
              }
              placeholder="Login de acesso"
              className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Senha</label>
            <input
              type="password"
              value={newBarber.senha}
              onChange={(e) =>
                setNewBarber({ ...newBarber, senha: e.target.value })
              }
              placeholder="Senha inicial"
              className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
              required
            />
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-[#f2b63a] text-[#2e2d37] font-semibold rounded-lg hover:brightness-110 transition-all text-sm"
            >
              Adicionar Barbeiro
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Barbeiros (mobile-first: cards empilhados; ações em coluna) */}
      <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
          Barbeiros Cadastrados
        </h2>
        {barbers.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">
            Nenhum barbeiro cadastrado ainda.
          </div>
        )}
        <div className="space-y-4">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="p-4 bg-[#2e2d37] rounded-lg border border-[#4b4950]/30 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              {editingBarber === barber.id ? (
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">Nome</label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nome: e.target.value })
                      }
                      placeholder="Nome do barbeiro"
                      className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">Nova Senha</label>
                    <input
                      type="password"
                      value={editForm.senha}
                      onChange={(e) =>
                        setEditForm({ ...editForm, senha: e.target.value })
                      }
                      placeholder="Nova senha (opcional)"
                      className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(barber.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#f2b63a] text-[#2e2d37] rounded-lg hover:brightness-110 transition-colors text-sm font-medium"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingBarber(null)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#4b4950] text-white rounded-lg hover:bg-[#3d3b42] transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-base">
                      {barber.nome}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Login: {barber.login}
                    </p>
                    <div className="mt-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                          barber.disponivel
                            ? "bg-green-900/20 text-green-400 border border-green-500/20"
                            : "bg-red-900/20 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {barber.disponivel ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
                    <button
                      onClick={() => startEditing(barber)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        toggleBarberStatus(barber.id, barber.disponivel)
                      }
                      className="w-full sm:w-auto px-4 py-2 bg-[#4b4950] text-white rounded-lg hover:bg-[#3d3b42] transition-colors text-sm"
                    >
                      {barber.disponivel
                        ? "Marcar Indisponível"
                        : "Marcar Disponível"}
                    </button>
                    <button
                      onClick={() => deleteBarber(barber.id, barber.nome)}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

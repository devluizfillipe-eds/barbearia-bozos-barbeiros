"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface AdminProfile {
  id: number;
  nome: string;
  login: string;
  foto_url?: string | null;
}

interface Barber {
  id: string;
  nome: string;
  disponivel: boolean;
}

export default function AdminPanel() {
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberLogin, setNewBarberLogin] = useState("");
  const [newBarberPassword, setNewBarberPassword] = useState("");
  const [addingBarber, setAddingBarber] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchAdminProfile(token);
    fetchBarbers();
  }, [router]);

  const getAuthToken = () =>
    localStorage.getItem("adminToken") || localStorage.getItem("token");

  const fetchAdminProfile = async (token: string) => {
    try {
      const response = await fetch("http://localhost:3000/admins/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin");
          return;
        }
        throw new Error("Erro ao buscar dados do admin");
      }

      const data: AdminProfile = await response.json();
      setAdminProfile(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados do administrador");
    }
  };

  const fetchBarbers = async () => {
    try {
      const response = await fetch("http://localhost:3000/barbers", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin");
          return;
        }
        throw new Error("Erro ao buscar barbeiros");
      }

      const data = await response.json();
      setBarbers(data);
    } catch (err) {
      setError("Erro ao carregar lista de barbeiros");
    } finally {
      setLoading(false);
    }
  };

  const addBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingBarber(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/barbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          nome: newBarberName,
          login: newBarberLogin,
          senha: newBarberPassword,
          disponivel: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar barbeiro");
      }

      setNewBarberName("");
      setNewBarberLogin("");
      setNewBarberPassword("");
      fetchBarbers();
    } catch (err) {
      setError("Erro ao adicionar barbeiro");
    } finally {
      setAddingBarber(false);
    }
  };

  const toggleBarberStatus = async (
    barberId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(
        `http://localhost:3000/barbers/${barberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            disponivel: !currentStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar status do barbeiro");
      }

      fetchBarbers();
    } catch (err) {
      setError("Erro ao atualizar status do barbeiro");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin");
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const token = getAuthToken();
    if (!token || !event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("foto", file);

    try {
      setUploadingPhoto(true);
      const response = await fetch("http://localhost:3000/admins/me/foto", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar foto do administrador");
      }

      const updatedProfile: AdminProfile = await response.json();
      setAdminProfile(updatedProfile);
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar a foto do administrador");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2e2d37] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl text-white">Carregando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2e2d37] text-white">
      {/* Header */}
      <div className="w-full bg-[#26242d] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#4b4950] overflow-hidden">
                  <Image
                    src={
                      adminProfile?.foto_url
                        ? (getImageUrl(adminProfile.foto_url) ??
                          "/images/logo.jpg")
                        : "/images/logo.jpg"
                    }
                    alt={adminProfile?.nome ?? "Administrador"}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl text-[#f2b63a] font-[700] font-['Almendra'] tracking-wider">
                  PAINEL ADMINISTRATIVO
                </h1>
                <p className="text-gray-400 text-sm">
                  {adminProfile
                    ? `Bem-vindo, ${adminProfile.nome}`
                    : "Gerenciamento de Barbeiros"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#2e2d37] rounded-full overflow-hidden flex items-center justify-center border border-[#f2b63a]/30">
              <Image
                src={
                  adminProfile?.foto_url
                    ? (getImageUrl(adminProfile.foto_url) ?? "/images/logo.jpg")
                    : "/images/logo.jpg"
                }
                alt={`Foto de ${adminProfile?.nome ?? "Administrador"}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#f2b63a]">
                Perfil do Administrador
              </h2>
              <p className="text-gray-400 text-sm">
                {adminProfile
                  ? `Login: ${adminProfile.login}`
                  : "Carregando dados do administrador..."}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label
              htmlFor="admin-photo-input"
              className="cursor-pointer px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium"
            >
              {uploadingPhoto ? "Atualizando..." : "Atualizar foto"}
            </label>
            <input
              id="admin-photo-input"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Adicionar Barbeiro */}
        <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold text-[#f2b63a] mb-4">
            Adicionar Novo Barbeiro
          </h2>
          <form onSubmit={addBarber} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Nome do Barbeiro
              </label>
              <input
                type="text"
                value={newBarberName}
                onChange={(e) => setNewBarberName(e.target.value)}
                placeholder="Nome do barbeiro"
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Login
              </label>
              <input
                type="text"
                value={newBarberLogin}
                onChange={(e) => setNewBarberLogin(e.target.value)}
                placeholder="Login para acesso"
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={newBarberPassword}
                onChange={(e) => setNewBarberPassword(e.target.value)}
                placeholder="Senha para acesso"
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={addingBarber}
              className="w-full px-6 py-2 bg-[#f2b63a] text-[#2e2d37] font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {addingBarber ? "Adicionando..." : "Adicionar Barbeiro"}
            </button>
          </form>
        </div>

        {/* Lista de Barbeiros */}
        <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
            Barbeiros Cadastrados
          </h2>
          <div className="space-y-4">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="flex items-center justify-between p-4 bg-[#2e2d37] rounded-lg border border-gray-700/50"
              >
                <span className="font-medium text-white">{barber.nome}</span>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      barber.disponivel
                        ? "bg-green-900/20 text-green-400 border border-green-500/20"
                        : "bg-red-900/20 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {barber.disponivel ? "Disponível" : "Indisponível"}
                  </span>
                  <button
                    onClick={() =>
                      toggleBarberStatus(barber.id, barber.disponivel)
                    }
                    className="px-4 py-2 bg-[#4b4950] text-white rounded-lg hover:bg-[#3d3b42] transition-colors"
                  >
                    {barber.disponivel
                      ? "Marcar Indisponível"
                      : "Marcar Disponível"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

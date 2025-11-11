"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface AdminProfile {
  id: number;
  nome: string;
  login: string;
  foto_url?: string | null;
}

interface BarberInfo {
  id: number;
  disponivel: boolean;
  foto_url?: string | null;
  nome?: string;
}

export default function AdminPainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("fila");
  const [adminName, setAdminName] = useState("Admin");
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [barber, setBarber] = useState<BarberInfo | null>(null);
  const [toggling, setToggling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/admin");
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (!userData.roles?.includes("admin")) {
        router.push("/admin");
        return;
      }
      setAdminName(userData.nome || "Admin");

      fetchAdminProfile(token);
      // também buscar info do barbeiro associado (se existir barberId no user)
      const barberId = userData.barberId;
      if (barberId) {
        fetchBarber(barberId, token);
      }

      // Verifica se está na rota padrão /admin/painel e redireciona para /admin/painel/fila
      if (window.location.pathname === "/admin/painel") {
        router.push("/admin/painel/fila");
      }
    } catch (error) {
      console.error("Erro ao processar dados do usuário:", error);
      router.push("/admin");
    }
  }, [router]);

  useEffect(() => {
    if (pathname) {
      const current = menuItems.find((item) => pathname.startsWith(item.path));
      if (current) {
        setActiveTab(current.id);
      }
    }
  }, [pathname]);

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
      setAdminName(data.nome || "Admin");
    } catch (error) {
      console.error("Erro ao carregar perfil do administrador:", error);
    }
  };

  const fetchBarber = async (barberId: number, token: string) => {
    try {
      const resp = await fetch(`http://localhost:3000/barbers/${barberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const data = await resp.json();
      setBarber({
        id: data.id,
        disponivel: data.disponivel,
        foto_url: data.foto_url,
        nome: data.nome,
      });
    } catch (e) {
      console.error("Erro ao carregar barbeiro vinculado:", e);
    }
  };

  const toggleDisponibilidade = async () => {
    if (!barber) return;
    // se for ficar disponível mostra confirmação como no painel do barbeiro
    if (!barber.disponivel) {
      setShowConfirm(true);
      return;
    }
    await efetivarToggle();
  };

  const efetivarToggle = async () => {
    if (!barber) return;
    setToggling(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `http://localhost:3000/barbers/${barber.id}/disponibilidade`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) throw new Error("Falha ao atualizar disponibilidade");
      const updated = await resp.json();
      setBarber((prev) =>
        prev ? { ...prev, disponivel: updated.disponivel } : prev
      );
      setShowConfirm(false);
    } catch (e) {
      console.error("Erro ao alternar disponibilidade:", e);
    } finally {
      setToggling(false);
    }
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const token = localStorage.getItem("token");
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
      setAdminName(updatedProfile.nome || adminName);

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              nome: updatedProfile.nome ?? parsedUser.nome,
              foto_url: updatedProfile.foto_url ?? null,
            })
          );
        } catch (err) {
          console.error("Erro ao atualizar dados do usuário localmente:", err);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar foto do administrador:", error);
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin");
  };

  const menuItems = [
    { id: "fila", label: "Fila Atual", path: "/admin/painel/fila" },
    { id: "dashboard", label: "Dashboard", path: "/admin/painel/dashboard" },
    { id: "barbeiros", label: "Barbeiros", path: "/admin/painel/barbeiros" },
    { id: "servicos", label: "Serviços", path: "/admin/painel/servicos" },
  ];

  const adminPhotoSrc = adminProfile?.foto_url
    ? (getImageUrl(adminProfile.foto_url) ?? "/images/logo.jpg")
    : "/images/logo.jpg";

  return (
    <div className="min-h-screen bg-[#2e2d37] text-white">
      {/* Header */}
      <div className="w-full bg-[#26242d] py-5">
        <div className="max-w-7xl mx-auto px-4 relative">
          {/* Botão logout mobile posicionado no canto superior direito */}
          <button
            onClick={handleLogout}
            className="sm:hidden absolute top-2 right-4 px-3 py-1 bg-[#4b4950] text-[#f2b63a] rounded-md text-[11px] font-medium shadow-sm hover:bg-[#3d3b42] transition-colors"
          >
            Sair
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#4b4950] overflow-hidden">
                  <Image
                    src={adminPhotoSrc}
                    alt={adminName || "Administrador"}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <label
                  htmlFor="admin-photo-input"
                  className="absolute -bottom-1 -right-1 bg-[#f2b63a] rounded-full p-1 cursor-pointer hover:brightness-110 transition-colors"
                  title="Alterar foto"
                >
                  {uploadingPhoto ? (
                    <svg
                      className="w-3.5 h-3.5 text-[#2e2d37] animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-3.5 h-3.5 text-[#2e2d37]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </label>
                <input
                  id="admin-photo-input"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl text-[#f2b63a] font-[700] font-['Almendra'] tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">
                  PAINEL ADMINISTRATIVO
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Bem-vindo, {adminName}
                </p>
                {/* Status textual mobile */}
                {barber && (
                  <p
                    className={`sm:hidden text-[11px] mt-1 font-semibold tracking-wider ${
                      barber.disponivel ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    STATUS: {barber.disponivel ? "ONLINE" : "OFFLINE"}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 whitespace-nowrap">
              {barber && (
                <>
                  <p
                    className={`text-xs font-semibold tracking-wider ${
                      barber.disponivel ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    STATUS: {barber.disponivel ? "ONLINE" : "OFFLINE"}
                  </p>
                  <button
                    onClick={toggleDisponibilidade}
                    disabled={toggling}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-[#4b4950]/50 text-gray-300 hover:bg-[#4b4950]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {barber.disponivel
                      ? "ficar indisponivel"
                      : "ficar disponivel"}
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm"
              >
                Sair
              </button>
            </div>
            {/* Mobile disponibilidade button (em fluxo, sem posicionamento absoluto) */}
            {barber && (
              <div className="sm:hidden w-full grid grid-cols-1 gap-2 mt-2">
                <button
                  onClick={toggleDisponibilidade}
                  disabled={toggling}
                  className="w-full px-3 py-2 rounded-md text-[10px] font-medium border border-[#4b4950]/50 text-gray-300 hover:bg-[#4b4950]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {barber.disponivel
                    ? "ficar indisponivel"
                    : "ficar disponivel"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-[#26242d] border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  router.push(item.path);
                }}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeTab === item.id
                    ? "text-[#f2b63a] border-b-2 border-[#f2b63a]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#26242d] w-full max-w-sm mx-auto p-6 rounded-xl border border-[#4b4950]/30">
            <h2 className="text-[#f2b63a] font-semibold text-sm mb-4">
              CONFIRMAR DISPONIBILIDADE
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              Você está prestes a ficar disponível para atendimento. Confirma
              que está pronto para receber clientes?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-[#4b4950]/20 text-gray-400 rounded-lg hover:bg-[#4b4950]/30 transition-colors text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={efetivarToggle}
                disabled={toggling}
                className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-xs font-medium disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

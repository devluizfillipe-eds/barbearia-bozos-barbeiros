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
    { id: "fila", label: "Fila de Espera", path: "/admin/painel/fila" },
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
      <div className="w-full bg-[#26242d] py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-[#4b4950] overflow-hidden">
                  <Image
                    src={adminPhotoSrc}
                    alt={adminName || "Administrador"}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <label
                  htmlFor="admin-photo-input"
                  className="absolute -bottom-1 -right-1 bg-[#f2b63a] text-[#2e2d37] text-[10px] font-semibold px-2 py-1 rounded-full cursor-pointer hover:brightness-110 transition"
                >
                  {uploadingPhoto ? "..." : "Atualizar"}
                </label>
                <input
                  id="admin-photo-input"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-xl text-[#f2b63a] font-[700] font-['Almendra'] tracking-wider">
                  PAINEL ADMINISTRATIVO
                </h1>
                <p className="text-gray-400 text-sm">Bem-vindo, {adminName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm"
            >
              Sair
            </button>
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
    </div>
  );
}

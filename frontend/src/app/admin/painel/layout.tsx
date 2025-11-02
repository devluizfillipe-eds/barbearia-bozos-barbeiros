"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminPainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("fila");
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
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

      // Verifica se está na rota padrão /admin/painel e redireciona para /admin/painel/fila
      if (window.location.pathname === "/admin/painel") {
        router.push("/admin/painel/fila");
      }
    } catch (error) {
      console.error("Erro ao processar dados do usuário:", error);
      router.push("/admin");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    router.push("/admin");
  };

  const menuItems = [
    { id: "fila", label: "Fila de Espera", path: "/admin/painel/fila" },
    { id: "dashboard", label: "Dashboard", path: "/admin/painel/dashboard" },
    { id: "barbeiros", label: "Barbeiros", path: "/admin/painel/barbeiros" },
    { id: "servicos", label: "Serviços", path: "/admin/painel/servicos" },
  ];

  return (
    <div className="min-h-screen bg-[#2e2d37] text-white">
      {/* Header */}
      <div className="w-full bg-[#26242d] py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Image
                src="/images/logo.jpg"
                alt="BOZOS BARBEIROS"
                width={48}
                height={48}
                className="rounded-full"
                priority
              />
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

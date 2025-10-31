"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoadingPage() {
  const { isAuthenticated, isAdmin } = useAuth();

  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      if (!isAuthenticated || !isAdmin) {
        await router.replace("/admin");
      } else {
        await router.replace("/admin/painel/fila");
      }
    };

    redirect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl text-white">Autenticando...</h2>
      </div>
    </div>
  );
}

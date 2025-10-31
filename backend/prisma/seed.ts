import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Garantir que exista um admin padrão com credenciais conhecidas
  const defaultAdminData = {
    nome: 'Administrador',
    login: 'admin',
    senha_hash: await bcrypt.hash('admin123', 10),
  };

  await prisma.admin.upsert({
    where: { login: defaultAdminData.login },
    update: {
      senha_hash: defaultAdminData.senha_hash,
      nome: defaultAdminData.nome,
    },
    create: defaultAdminData,
  });

  // Criar/Atualizar admin fixo
  const adminData = {
    nome: 'Adriano',
    login: 'adriano',
    senha_hash: await bcrypt.hash('123456', 12),
  };

  const admin = await prisma.admin.upsert({
    where: { login: adminData.login },
    update: {
      senha_hash: adminData.senha_hash,
      nome: adminData.nome,
    },
    create: adminData,
  });

  console.log('Admin fixo criado/atualizado:', {
    id: admin.id,
    nome: admin.nome,
    login: admin.login,
  });

  // Primeiro, limpa a tabela de serviços existente
  await prisma.service.deleteMany();

  // Insere os serviços iniciais
  await prisma.service.createMany({
    data: [
      {
        nome: 'Corte',
        descricao: 'Corte de cabelo masculino',
        tempo_estimado: 25,
        preco: 30.0,
        ativo: true,
      },
      {
        nome: 'Barba',
        descricao: 'Barba completa',
        tempo_estimado: 15,
        preco: 30.0,
        ativo: true,
      },
      {
        nome: 'Sobrancelha',
        descricao: 'Designer de sobrancelha',
        tempo_estimado: 10,
        preco: 10.0,
        ativo: true,
      },
      {
        nome: 'Pézinho',
        descricao: 'Acabamento do pézinho',
        tempo_estimado: 5,
        preco: 10.0,
        ativo: true,
      },
      {
        nome: 'Tintura',
        descricao: 'Tintura de cabelo',
        tempo_estimado: 30,
        preco: 20.0,
        ativo: true,
      },
      {
        nome: 'Tintura Barba',
        descricao: 'Tintura de barba',
        tempo_estimado: 15,
        preco: 20.0,
        ativo: true,
      },
      {
        nome: 'Textura',
        descricao: 'Aplicação de texturização',
        tempo_estimado: 40,
        preco: 50.0,
        ativo: true,
      },
      {
        nome: 'Alisante',
        descricao: 'Aplicação de alisamento',
        tempo_estimado: 35,
        preco: 40.0,
        ativo: true,
      },
      {
        nome: 'Luzes',
        descricao: 'Luzes no cabelo',
        tempo_estimado: 60,
        preco: 60.0,
        ativo: true,
      },
      {
        nome: 'Descolorir',
        descricao: 'Descoloração completa',
        tempo_estimado: 90,
        preco: 70.0,
        ativo: true,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config';
import { PrismaClient, type Admin } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ensureAdminAsBarber = async (adminRecord: Admin, password: string) => {
  const barberLogin = `${adminRecord.login}.barber`;
  const barberPasswordHash = await bcrypt.hash(password, 12);

  await prisma.barber.upsert({
    where: { adminId: adminRecord.id },
    update: {
      nome: adminRecord.nome,
      login: barberLogin,
      senha_hash: barberPasswordHash,
      ativo: true,
      disponivel: true,
      foto_url: adminRecord.foto_url ?? null,
    },
    create: {
      nome: adminRecord.nome,
      login: barberLogin,
      senha_hash: barberPasswordHash,
      adminId: adminRecord.id,
      ativo: true,
      disponivel: true,
      foto_url: adminRecord.foto_url ?? null,
    },
  });

  console.log('Admin vinculado a barbeiro:', {
    adminId: adminRecord.id,
    barberLogin,
  });
};

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Adriano';
  const adminLogin = process.env.SEED_ADMIN_LOGIN ?? 'adriano';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? '123456';
  const adminPhotoEnv = process.env.SEED_ADMIN_PHOTO_URL;

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const photoData =
    adminPhotoEnv !== undefined ? { foto_url: adminPhotoEnv || null } : {};

  const admin = await prisma.admin.upsert({
    where: { login: adminLogin },
    update: {
      nome: adminName,
      senha_hash: passwordHash,
      ...photoData,
    },
    create: {
      nome: adminName,
      login: adminLogin,
      senha_hash: passwordHash,
      ...photoData,
    },
  });

  console.log('Admin seed aplicado:', {
    id: admin.id,
    login: admin.login,
  });

  await ensureAdminAsBarber(admin, adminPassword);

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

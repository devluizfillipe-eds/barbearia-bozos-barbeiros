import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function pruneAdmins() {
  const adminLogin = process.env.SEED_ADMIN_LOGIN ?? 'adriano';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? '123456';
  const barberLogin =
    process.env.SEED_ADMIN_BARBER_LOGIN ?? `${adminLogin}.barber`;
  const barberPassword =
    process.env.SEED_ADMIN_BARBER_PASSWORD ?? adminPassword;

  try {
    const admin = await prisma.admin.findUnique({
      where: { login: adminLogin },
    });

    if (!admin) {
      console.log(`Admin ${adminLogin} não encontrado. Criando novo.`);
      const senhaHash = await bcrypt.hash(adminPassword, 12);
      const createdAdmin = await prisma.admin.create({
        data: {
          nome: process.env.SEED_ADMIN_NAME ?? 'Adriano',
          login: adminLogin,
          senha_hash: senhaHash,
          foto_url:
            process.env.SEED_ADMIN_PHOTO_URL !== undefined
              ? process.env.SEED_ADMIN_PHOTO_URL || null
              : null,
        },
      });
      await ensureBarber(
        createdAdmin.id,
        createdAdmin.nome,
        barberLogin,
        barberPassword,
      );
    } else {
      await ensureBarber(admin.id, admin.nome, barberLogin, barberPassword);
    }

    const adminRecord = await prisma.admin.findUnique({
      where: { login: adminLogin },
    });

    if (!adminRecord) {
      throw new Error('Falha ao garantir admin principal.');
    }

    console.log('Removendo barbeiros não associados ao admin principal...');
    await prisma.barber.deleteMany({
      where: {
        OR: [
          { adminId: { not: adminRecord.id } },
          { adminId: null, login: { not: barberLogin } },
        ],
      },
    });

    console.log('Removendo admins extras...');
    await prisma.admin.deleteMany({
      where: { login: { not: adminLogin } },
    });

    console.log('Estado de admin/barbeiro limpo.');
  } catch (error) {
    console.error('Erro ao podar admins:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function ensureBarber(
  adminId: number,
  adminName: string,
  barberLogin: string,
  barberPassword: string,
) {
  const senhaHash = await bcrypt.hash(barberPassword, 12);
  const barber = await prisma.barber.findUnique({
    where: { login: barberLogin },
  });

  if (!barber) {
    console.log('Criando barbeiro vinculado ao admin principal...');
    await prisma.barber.create({
      data: {
        nome: adminName,
        login: barberLogin,
        senha_hash: senhaHash,
        adminId,
        ativo: true,
        disponivel: true,
        foto_url:
          process.env.SEED_ADMIN_BARBER_PHOTO_URL !== undefined
            ? process.env.SEED_ADMIN_BARBER_PHOTO_URL || null
            : null,
      },
    });
  } else {
    console.log('Atualizando barbeiro vinculado ao admin principal...');
    await prisma.barber.update({
      where: { id: barber.id },
      data: {
        nome: adminName,
        senha_hash: senhaHash,
        adminId,
        ativo: true,
        disponivel: true,
        foto_url:
          process.env.SEED_ADMIN_BARBER_PHOTO_URL !== undefined
            ? process.env.SEED_ADMIN_BARBER_PHOTO_URL || null
            : barber.foto_url,
      },
    });
  }
}

pruneAdmins();

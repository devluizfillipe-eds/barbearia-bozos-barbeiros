import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    // Criar hash da senha
    const senha_hash = await bcrypt.hash('123456', 12);

    // Atualizar o admin
    const admin = await prisma.admin.update({
      where: {
        login: 'admin',
      },
      data: {
        nome: 'Adriano',
        login: 'adriano.adm',
        senha_hash,
      },
    });

    console.log('Admin atualizado com sucesso:', admin);
  } catch (error) {
    console.error('Erro ao atualizar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();

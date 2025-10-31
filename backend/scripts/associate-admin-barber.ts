import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function associateAdminWithBarber() {
  try {
    // 1. Encontrar o admin
    const admin = await prisma.admin.findUnique({
      where: { login: 'admin' },
    });

    if (!admin) {
      console.error('Admin não encontrado');
      return;
    }

    // 2. Criar um barbeiro associado ao admin
    const barber = await prisma.barber.create({
      data: {
        nome: 'Administrador',
        login: 'admin.barber',
        senha_hash: await bcrypt.hash('admin123', 10),
        adminId: admin.id,
        ativo: true,
        disponivel: true,
      },
    });

    console.log('Barbeiro criado e associado ao admin:', barber);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

associateAdminWithBarber();

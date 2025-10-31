import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  await prisma.admin.update({
    where: {
      login: 'admin',
    },
    data: {
      senha_hash: hash,
    },
  });

  console.log('Senha do admin atualizada com sucesso!');
}

updateAdminPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro:', error);
    process.exit(1);
  });

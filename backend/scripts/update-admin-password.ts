import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  const login =
    process.env.ADMIN_LOGIN ?? process.env.SEED_ADMIN_LOGIN ?? 'adriano';
  const password =
    process.env.ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? '123456';

  if (process.env.ADMIN_PASSWORD === undefined) {
    console.warn(
      'ADMIN_PASSWORD não fornecida. Utilizando senha padrão configurada para o seed.',
    );
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.admin.update({
    where: {
      login,
    },
    data: {
      senha_hash: hash,
    },
  });

  console.log(`Senha do admin (login: ${login}) atualizada com sucesso!`);
}

updateAdminPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

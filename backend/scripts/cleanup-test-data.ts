import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('Limpando dados de fila e métricas...');
    await prisma.queueService.deleteMany();
    await prisma.queue.deleteMany();
    await prisma.log.deleteMany();

    console.log('Removendo clientes (users) de teste...');
    await prisma.user.deleteMany();

    console.log('Removendo todos os barbeiros...');
    await prisma.barber.deleteMany();

    // Limpa imagens de uploads mantendo apenas arquivos reconhecidos como logos
    try {
      const uploadsDir = path.resolve(__dirname, '..', 'uploads');
      const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
      const kept: string[] = [];
      const removed: string[] = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const keep = /^logo/i.test(entry.name);
        if (keep) {
          kept.push(entry.name);
          continue;
        }
        await fs.unlink(path.join(uploadsDir, entry.name));
        removed.push(entry.name);
      }
      console.log(`Uploads limpo. Mantidos: [${kept.join(', ')}]. Removidos: ${removed.length}.`);
    } catch (e) {
      console.warn('Aviso ao limpar uploads:', e instanceof Error ? e.message : e);
    }

    console.log('Garantindo admin permanente...');
    const senha_hash = await bcrypt.hash('123456', 12);
    await prisma.admin.upsert({
      where: { login: 'adriano.adm' },
      update: { nome: 'Adriano', senha_hash },
      create: { nome: 'Adriano', login: 'adriano.adm', senha_hash },
    });

    console.log('Removendo outros admins que não sejam o permanente...');
    await prisma.admin.deleteMany({
      where: { login: { not: 'adriano.adm' } },
    });

    console.log('Concluído. Estado limpo com admin permanente pronto.');
  } catch (error) {
    console.error('Erro ao executar limpeza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();

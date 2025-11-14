import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import * as bcrypt from 'bcryptjs';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        login: true,
        // @ts-ignore Campo será reconhecido após atualizar o client Prisma
        foto_url: true,
        data_criacao: true,
        barber: true,
      },
    });
  }

  @Get('me')
  @Roles('admin')
  async getMe(@Req() req: Request & { user?: { userId: number } }) {
    const adminId = req.user?.userId;

    return this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        nome: true,
        login: true,
        // @ts-ignore Campo será reconhecido após atualizar o client Prisma
        foto_url: true,
        data_criacao: true,
      },
    });
  }

  @Post()
  @Roles('admin')
  async create(
    @Body() data: { nome: string; login: string; password: string },
  ) {
    const senha_hash = await bcrypt.hash(data.password, 10);
    const admin = await this.prisma.admin.create({
      data: {
        nome: data.nome,
        login: data.login,
        senha_hash,
      },
    });

    // Garante que o admin recém-criado também possa atuar como barbeiro
    await this.prisma.barber.upsert({
      where: { adminId: admin.id },
      update: {
        nome: admin.nome,
        login: `${admin.login}.barber`,
        senha_hash,
        ativo: true,
        disponivel: true,
        // Mantém foto do admin sincronizada com o barbeiro vinculado
        foto_url: admin.foto_url ?? null,
      },
      create: {
        nome: admin.nome,
        login: `${admin.login}.barber`,
        senha_hash,
        adminId: admin.id,
        ativo: true,
        disponivel: true,
        foto_url: admin.foto_url ?? null,
      },
    });

    return {
      id: admin.id,
      nome: admin.nome,
      login: admin.login,
      // @ts-ignore Campo será reconhecido após atualizar o client Prisma
      foto_url: admin.foto_url,
      data_criacao: admin.data_criacao,
    };
  }

  @Post('me/foto')
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('foto', {
      dest: './uploads',
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
          return cb(
            new BadRequestException(
              'Apenas imagens JPG ou PNG são permitidas.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFoto(
    @Req() req: Request & { user?: { userId: number } },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem é obrigatório.');
    }

    const adminId = req.user?.userId;
    const fileUrl = `/uploads/${file.filename}`;

    // Atualiza foto do admin
    const updatedAdmin = await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        foto_url: fileUrl,
      },
      select: {
        id: true,
        nome: true,
        login: true,
        foto_url: true,
        data_criacao: true,
      },
    });

    // Sincroniza foto com barbeiro associado
    try {
      let barber = await this.prisma.barber.findUnique({
        where: { adminId: adminId },
        select: { id: true },
      });

      // Se não existir barbeiro associado, criar automaticamente
      if (!barber) {
        const randomPass = Math.random().toString(36).slice(2, 10);
        const senha_hash = await bcrypt.hash(randomPass, 10);
        const created = await this.prisma.barber.create({
          data: {
            nome: updatedAdmin.nome,
            login: `${updatedAdmin.login}.barber`,
            senha_hash,
            adminId: updatedAdmin.id,
            ativo: true,
            disponivel: true,
            // @ts-ignore
            foto_url: fileUrl,
          },
          select: { id: true },
        });
        barber = created;
      } else {
        await this.prisma.barber.update({
          where: { id: barber.id },
          data: { foto_url: fileUrl },
          select: { id: true },
        });
      }
    } catch (e) {
      // Não interromper fluxo em caso de erro
    }

    return updatedAdmin;
  }
}

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
        // @ts-ignore Campo será reconhecido após atualizar o cliente Prisma
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
        // @ts-ignore Campo será reconhecido após atualizar o cliente Prisma
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
    return this.prisma.admin.create({
      data: {
        nome: data.nome,
        login: data.login,
        senha_hash,
      },
      select: {
        id: true,
        nome: true,
        login: true,
        // @ts-ignore Campo será reconhecido após atualizar o cliente Prisma
        foto_url: true,
        data_criacao: true,
      },
    });
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

    return this.prisma.admin.update({
      where: { id: adminId },
      data: {
        // @ts-ignore Campo será reconhecido após atualizar o cliente Prisma
        foto_url: fileUrl,
      },
      select: {
        id: true,
        nome: true,
        login: true,
        // @ts-ignore Campo será reconhecido após atualizar o cliente Prisma
        foto_url: true,
        data_criacao: true,
      },
    });
  }
}

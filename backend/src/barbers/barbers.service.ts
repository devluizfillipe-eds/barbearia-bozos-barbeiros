import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BarbersService {
  constructor(private prisma: PrismaService) {}

  async create(createBarberDto: CreateBarberDto) {
    // Verificar se login já existe
    const existingBarber = await this.prisma.barber.findUnique({
      where: { login: createBarberDto.login },
    });

    if (existingBarber) {
      throw new ConflictException('Login já está em uso');
    }

    // Hash da senha
    const senha_hash = await bcrypt.hash(createBarberDto.senha, 12);

    const barber = await this.prisma.barber.create({
      data: {
        nome: createBarberDto.nome,
        login: createBarberDto.login,
        senha_hash,
      },
    });

    // Log da ação
    await this.prisma.log.create({
      data: {
        acao: 'BARBEIRO_CRIADO',
        detalhes: `Barbeiro ${barber.nome} criado`,
        usuario_tipo: 'admin',
      },
    });

    const { senha_hash: _, ...result } = barber;
    return result;
  }

  async findAll() {
    const barbers = await this.prisma.barber.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        login: true,
        foto_url: true,
        ativo: true,
        disponivel: true,
        data_criacao: true,
      },
      orderBy: { nome: 'asc' },
    });

    return barbers;
  }

  async findByAdminId(adminId: number) {
    const barbers = await this.prisma.barber.findMany({
      where: {
        adminId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        login: true,
        foto_url: true,
        ativo: true,
        disponivel: true,
        data_criacao: true,
      },
    });

    return barbers;
  }

  async getDisponiveis() {
    const barbers = await this.prisma.barber.findMany({
      where: {
        ativo: true,
        disponivel: true,
      },
      select: {
        id: true,
        nome: true,
        login: true,
        foto_url: true,
        ativo: true,
        disponivel: true,
        data_criacao: true,
      },
      orderBy: { nome: 'asc' },
    });

    return barbers;
  }

  async findOne(id: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        login: true,
        foto_url: true,
        ativo: true,
        disponivel: true,
        data_criacao: true,
      },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    return barber;
  }

  async update(id: number, updateBarberDto: UpdateBarberDto) {
    const barber = await this.prisma.barber.findUnique({
      where: { id },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Verificar se novo login já existe (se estiver sendo alterado)
    if (updateBarberDto.login && updateBarberDto.login !== barber.login) {
      const existingBarber = await this.prisma.barber.findUnique({
        where: { login: updateBarberDto.login },
      });

      if (existingBarber) {
        throw new ConflictException('Login já está em uso');
      }
    }

    const updateData: any = { ...updateBarberDto };

    // Se houver senha, fazer hash
    if (updateBarberDto.senha) {
      updateData.senha_hash = await bcrypt.hash(updateBarberDto.senha, 12);
      delete updateData.senha;
    }

    const updatedBarber = await this.prisma.barber.update({
      where: { id },
      data: updateData,
    });

    // Log da ação
    await this.prisma.log.create({
      data: {
        acao: 'BARBEIRO_ATUALIZADO',
        detalhes: `Barbeiro ${updatedBarber.nome} atualizado`,
        usuario_tipo: 'admin',
      },
    });

    const { senha_hash: _, ...result } = updatedBarber;
    return result;
  }

  async toggleDisponibilidade(id: number) {
    const barbeiro = await this.prisma.barber.findUnique({
      where: { id },
    });

    if (!barbeiro) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    return this.prisma.barber.update({
      where: { id },
      data: {
        disponivel: !barbeiro.disponivel,
      },
      select: {
        id: true,
        nome: true,
        login: true,
        foto_url: true,
        ativo: true,
        disponivel: true,
        data_criacao: true,
      },
    });
  }

  async updateFoto(id: number, fotoUrl: string) {
    const barbeiro = await this.prisma.barber.findUnique({
      where: { id },
    });

    if (!barbeiro) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    const updatedBarber = await this.prisma.barber.update({
      where: { id },
      data: {
        foto_url: fotoUrl,
      },
      select: {
        id: true,
        nome: true,
        login: true,
        foto_url: true,
        ativo: true,
        disponivel: true,
        data_criacao: true,
      },
    });

    return updatedBarber;
  }

  async associarAdmin(barberId: number, adminId: number) {
    const barbeiro = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barbeiro) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin não encontrado');
    }

    return this.prisma.barber.update({
      where: { id: barberId },
      data: {
        adminId: adminId,
      },
    });
  }

  async remove(id: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { id },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    // Soft delete - marcar como inativo
    const updatedBarber = await this.prisma.barber.update({
      where: { id },
      data: { ativo: false },
    });

    // Log da ação
    await this.prisma.log.create({
      data: {
        acao: 'BARBEIRO_DESATIVADO',
        detalhes: `Barbeiro ${updatedBarber.nome} desativado`,
        usuario_tipo: 'admin',
      },
    });

    return { message: 'Barbeiro desativado com sucesso' };
  }
}

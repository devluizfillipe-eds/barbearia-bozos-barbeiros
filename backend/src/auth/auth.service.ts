import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async updateAdmin(id: number, updateAdminDto: UpdateAdminDto) {
    const updateData: any = {
      ...updateAdminDto,
    };

    if (updateAdminDto.senha) {
      updateData.senha_hash = await bcrypt.hash(updateAdminDto.senha, 12);
      delete updateData.senha;
    }

    const admin = await this.prisma.admin.update({
      where: { id },
      data: updateData,
    });

    const { senha_hash, ...result } = admin;
    return result;
  }

  async validateUser(loginDto: LoginDto) {
    const { login, password, type } = loginDto;

    // Log inicial sem dados sensíveis
    console.log('Iniciando validação de usuário:', {
      type,
      timestamp: new Date().toISOString(),
    });

    try {
      let user;
      // Buscar usuário com base no tipo
      if (type === 'barber') {
        user = await this.prisma.barber.findUnique({
          where: { login },
          select: {
            id: true,
            nome: true,
            login: true,
            senha_hash: true,
            ativo: true,
            disponivel: true,
            // @ts-ignore Campo será reconhecido após atualizar o cliente Prisma
            foto_url: true,
          },
        });
      } else if (type === 'admin') {
        user = await this.prisma.admin.findUnique({
          where: { login },
          select: {
            id: true,
            nome: true,
            login: true,
            senha_hash: true,
            // @ts-ignore Campo será reconhecido após atualizar o cliente Prisma
            foto_url: true,
            barber: {
              select: {
                id: true,
                nome: true,
                ativo: true,
              },
            },
          },
        });
      }

      if (!user) {
        console.log('Usuário não encontrado:', {
          type,
          timestamp: new Date().toISOString(),
        });
        return null;
      }

      // Verificar se é um barbeiro e está ativo
      if (type === 'barber' && !user.ativo) {
        console.log('Barbeiro inativo tentando fazer login');
        return null;
      }

      console.log('Verificando credenciais para usuário encontrado');
      const passwordMatch = await bcrypt.compare(password, user.senha_hash);

      if (passwordMatch) {
        console.log('Login bem-sucedido:', {
          type,
          timestamp: new Date().toISOString(),
        });
        const { senha_hash, ...result } = user;
        return result;
      }

      console.log('Senha incorreta');
      return null;
    } catch (error) {
      console.error('Erro na validação do usuário:', {
        error: error.message,
        type,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async setup() {
    try {
      // Criar admin
      const adminSenhaHash = await bcrypt.hash('123456', 12);
      const admin = await this.prisma.admin.create({
        data: {
          nome: 'Adriano',
          login: 'adriano.adm',
          senha_hash: adminSenhaHash,
        },
      });

      // Criar barbeiro
      const barbeiroPwd = await bcrypt.hash('123456', 12);
      const barbeiro = await this.prisma.barber.create({
        data: {
          nome: 'Adriano',
          login: 'adriano',
          senha_hash: barbeiroPwd,
          ativo: true,
          disponivel: true,
          adminId: admin.id, // Vinculando o barbeiro ao admin
        },
      });

      // Criar serviços
      const servicos = await this.prisma.service.createMany({
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
        ],
      });

      return {
        message: 'Dados iniciais criados com sucesso',
        admin: { ...admin, senha_hash: undefined },
        barbeiro: { ...barbeiro, senha_hash: undefined },
        servicos,
      };
    } catch (error) {
      console.error('Erro ao criar dados iniciais:', error);
      throw new Error('Erro ao criar dados iniciais');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Determina os roles do usuário
    const roles = [loginDto.type];
    let barberId = null;

    // Se for admin, verifica se também é barbeiro
    if (loginDto.type === 'admin') {
      const barber = await this.prisma.barber.findFirst({
        where: { adminId: user.id },
      });
      if (barber) {
        roles.push('barber');
        barberId = barber.id;
      }
    }

    const payload = {
      username: user.login,
      sub: user.id,
      roles,
      primaryRole: loginDto.type,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        roles,
        primaryRole: loginDto.type,
        barberId,
        foto_url: 'foto_url' in user ? (user.foto_url ?? null) : null,
      },
    };
  }
}

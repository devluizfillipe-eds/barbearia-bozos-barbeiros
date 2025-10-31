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
    console.log(`Tentativa de login - Login: ${login}, Tipo: ${type}`);

    let user;
    if (type === 'barber') {
      user = await this.prisma.barber.findUnique({ where: { login } });
    } else if (type === 'admin') {
      user = await this.prisma.admin.findUnique({
        where: { login },
        include: { barber: true },
      });
    }

    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');

    if (!user) {
      console.log('Login não encontrado');
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.senha_hash);
    console.log('Senha corresponde:', passwordMatch);
    console.log('Hash armazenado:', user.senha_hash);

    if (passwordMatch) {
      const { senha_hash, ...result } = user;
      return result;
    }
    return null;
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
      },
    };
  }
}

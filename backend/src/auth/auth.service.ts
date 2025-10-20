import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const { login, password, type } = loginDto;

    let user;
    if (type === 'barber') {
      user = await this.prisma.barber.findUnique({ where: { login } });
    } else if (type === 'admin') {
      user = await this.prisma.admin.findUnique({ where: { login } });
    }

    if (user && (await bcrypt.compare(password, user.senha_hash))) {
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

    const payload = {
      username: user.login,
      sub: user.id,
      type: loginDto.type,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        type: loginDto.type,
      },
    };
  }
}

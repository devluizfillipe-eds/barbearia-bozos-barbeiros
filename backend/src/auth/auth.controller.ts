import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('create-admin')
  async createAdmin() {
    // Criar hash da senha corretamente
    const senha_hash = await bcrypt.hash('123456', 12);

    // Criar admin padrão (apenas para desenvolvimento)
    const admin = await this.authService['prisma'].admin.upsert({
      where: { login: 'admin' },
      update: { senha_hash }, // Atualizar a senha também
      create: {
        nome: 'Administrador',
        login: 'admin',
        senha_hash: senha_hash,
      },
    });

    return {
      message: 'Admin criado/atualizado',
      admin: {
        id: admin.id,
        nome: admin.nome,
        login: admin.login,
      },
    };
  }
}

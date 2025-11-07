import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Put('admin/:id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.authService.updateAdmin(+id, updateAdminDto);
  }

  @Post('setup')
  @HttpCode(200)
  async setup() {
    return this.authService.setup();
  }

  @Post('login')
  @HttpCode(200) // Força status 200 OK em vez de 201 Created
  async login(@Body() loginDto: LoginDto) {
    try {
      // Log dos dados recebidos (sem a senha)
      console.log('Tentativa de login:', {
        login: loginDto.login,
        type: loginDto.type,
        timestamp: new Date().toISOString(),
      });

      if (!loginDto.login?.trim() || !loginDto.password?.trim()) {
        throw new UnauthorizedException({
          message: 'Dados de login incompletos',
          details: 'Login e senha são obrigatórios',
        });
      }

      const result = await this.authService.login(loginDto);

      if (!result) {
        console.log('Login falhou: credenciais inválidas');
        throw new UnauthorizedException({
          message: 'Credenciais inválidas',
          details: 'Login ou senha incorretos',
        });
      }

      // Log do sucesso (sem dados sensíveis)
      console.log('Login bem-sucedido:', {
        userType: loginDto.type,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      console.error('Erro no login:', {
        type: error.constructor.name,
        message: error.message,
        timestamp: new Date().toISOString(),
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException({
        message: 'Erro ao realizar login',
        details: error.message,
      });
    }
  }
}

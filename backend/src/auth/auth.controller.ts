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

  @Post('login')
  @HttpCode(200) // Força status 200 OK em vez de 201 Created
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      if (!result) {
        throw new UnauthorizedException({
          message: 'Credenciais inválidas',
          details: 'Login ou senha incorretos',
        });
      }
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
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

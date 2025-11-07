import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BarbersService } from './barbers.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AssociarAdminDto } from './dto/associar-admin.dto';

@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() createBarberDto: CreateBarberDto) {
    return this.barbersService.create(createBarberDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('adminId') adminId?: string) {
    if (adminId) {
      return this.barbersService.findByAdminId(parseInt(adminId));
    }
    return this.barbersService.findAll();
  }

  @Get('disponiveis')
  getDisponiveis() {
    return this.barbersService.getDisponiveis();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.barbersService.findOne(parseInt(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateBarberDto: UpdateBarberDto) {
    return this.barbersService.update(parseInt(id), updateBarberDto);
  }

  @Patch(':id/disponibilidade')
  @UseGuards(JwtAuthGuard)
  toggleDisponibilidade(@Param('id') id: string) {
    return this.barbersService.toggleDisponibilidade(parseInt(id));
  }

  @Post('associar-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  associarAdmin(@Body() dto: AssociarAdminDto) {
    return this.barbersService.associarAdmin(dto.barberId, dto.adminId);
  }

  @Post(':id/foto')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('foto', {
      dest: './uploads',
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Apenas imagens são permitidas.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileName = file.filename;
    const fileUrl = `/uploads/${fileName}`;
    return this.barbersService.updateFoto(parseInt(id), fileUrl);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.barbersService.remove(parseInt(id));
  }
}

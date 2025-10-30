import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';

@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Post()
  create(@Body() createBarberDto: CreateBarberDto) {
    return this.barbersService.create(createBarberDto);
  }

  @Get()
  findAll() {
    return this.barbersService.findAll();
  }

  @Get('disponiveis')
  getDisponiveis() {
    return this.barbersService.getDisponiveis();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.barbersService.findOne(parseInt(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBarberDto: UpdateBarberDto) {
    return this.barbersService.update(parseInt(id), updateBarberDto);
  }

  @Patch(':id/disponibilidade')
  toggleDisponibilidade(@Param('id') id: string) {
    return this.barbersService.toggleDisponibilidade(parseInt(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.barbersService.remove(parseInt(id));
  }
}

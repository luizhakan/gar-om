import { Body, Controller, Get, Put } from '@nestjs/common';
import { MesasService } from './mesas.service';
import { ConfigurarMesasDto } from './dto/configurar-mesas.dto';

@Controller('mesas')
export class MesasController {
    constructor(private readonly mesasService: MesasService) {}

    @Get()
    listar() {
        return this.mesasService.listar();
    }

    @Put('configurar')
    configurar(@Body() dto: ConfigurarMesasDto) {
        const baseUrl = dto.baseUrl || 'http://localhost:5173';
        return this.mesasService.configurar(dto.total, baseUrl);
    }
}

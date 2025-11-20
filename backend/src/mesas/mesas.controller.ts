import { Body, Controller, Get, Headers, Put } from '@nestjs/common';
import { MesasService } from './mesas.service';
import { ConfigurarMesasDto } from './dto/configurar-mesas.dto';

@Controller('mesas')
export class MesasController {
    constructor(private readonly mesasService: MesasService) {}

    @Get()
    listar(@Headers('x-restaurante-id') restauranteId?: string) {
        return this.mesasService.listar(restauranteId);
    }

    @Put('configurar')
    configurar(@Body() dto: ConfigurarMesasDto, @Headers('x-restaurante-id') restauranteId?: string) {
        const baseUrl = dto.baseUrl || 'http://localhost:5173';
        return this.mesasService.configurar(dto.total, baseUrl, restauranteId);
    }
}

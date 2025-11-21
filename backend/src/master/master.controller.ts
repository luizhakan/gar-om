import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { AtualizarAssinaturaDto } from './dto/atualizar-assinatura.dto';
import { MasterService } from './master.service';

@Controller('master')
@UseGuards(AuthGuard)
@Roles('master')
export class MasterController {
    constructor(private readonly masterService: MasterService) {}

    @Get('restaurantes')
    listar() {
        return this.masterService.listarRestaurantes();
    }

    @Patch('restaurantes/:id')
    atualizar(
        @Param('id') id: string,
        @Body() dto: AtualizarAssinaturaDto,
    ) {
        const data = this.masterService.normalizarAtualizacaoAssinatura(dto);
        return this.masterService.atualizarRestaurante(id, data);
    }
}

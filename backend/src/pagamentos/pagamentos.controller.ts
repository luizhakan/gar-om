import { Controller, Post, Body, Get, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { SkipSubscriptionCheck } from '../auth/subscription.guard';
import { isValidPlanCode, PlanCode } from './planos';

@Controller('pagamentos')
@UseGuards(AuthGuard)
@SkipSubscriptionCheck()
export class PagamentosController {
    constructor(private readonly pagamentosService: PagamentosService) {}

    /**
     * Cria pagamento direto com cartão
     * POST /pagamentos
     */
    @Post()
    async create(
        @Body() createPaymentDto: CreatePaymentDto,
        @UsuarioAutenticado() usuario: any,
    ) {
        return this.pagamentosService.createPayment(createPaymentDto, usuario.restauranteId);
    }

    /**
     * Cria preferência de checkout (PIX, boleto, cartão)
     * POST /pagamentos/checkout
     */
    @Post('checkout')
    async createCheckout(
        @Body() body: { planCode?: string },
        @UsuarioAutenticado() usuario: any,
    ) {
        const planCode = body.planCode || 'mensal';
        if (!isValidPlanCode(planCode)) {
            throw new BadRequestException(`planCode inválido: ${planCode}`);
        }
        return this.pagamentosService.createCheckoutPreference(usuario.restauranteId, planCode as PlanCode);
    }

    /**
     * Retorna elegibilidade e vagas do Plano Fundador
     * GET /pagamentos/vagas-fundador
     */
    @Get('vagas-fundador')
    async vagasFundador(@UsuarioAutenticado() usuario: any) {
        return this.pagamentosService.vagasFundador(usuario.restauranteId);
    }

    /**
     * Busca um pagamento específico
     * GET /pagamentos/:id
     */
    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @UsuarioAutenticado() usuario: any,
    ) {
        return this.pagamentosService.findOne(id, usuario.restauranteId);
    }
}

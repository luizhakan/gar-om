import { Controller, Post, Body, Get, Param, UseGuards, Query } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { SkipSubscriptionCheck } from '../auth/subscription.guard';

@Controller('pagamentos')
@UseGuards(AuthGuard)
@SkipSubscriptionCheck()
export class PagamentosController {
    constructor(private readonly pagamentosService: PagamentosService) {}

    /**
     * Cria um novo pagamento (método antigo com cartão)
     * POST /pagamentos
     */
    @Post()
    async create(
        @Body() createPaymentDto: CreatePaymentDto,
        @UsuarioAutenticado() usuario: any,
    ) {
        // Normaliza campos camelCase para snake_case
        const normalizedDto: CreatePaymentDto = {
            ...createPaymentDto,
            transaction_amount: createPaymentDto.transaction_amount || createPaymentDto.transactionAmount,
            payment_method_id: createPaymentDto.payment_method_id || createPaymentDto.paymentMethodId,
        };

        return this.pagamentosService.createPayment(normalizedDto, usuario.restauranteId);
    }

    /**
     * Cria uma preference de checkout do Mercado Pago (aceita PIX, boleto, cartão)
     * POST /pagamentos/checkout
     */
    @Post('checkout')
    async createCheckout(
        @Body() body: { planDurationMonths?: number },
        @UsuarioAutenticado() usuario: any,
    ) {
        const planDurationMonths = body.planDurationMonths || 1;
        return this.pagamentosService.createCheckoutPreference(usuario.restauranteId, planDurationMonths);
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

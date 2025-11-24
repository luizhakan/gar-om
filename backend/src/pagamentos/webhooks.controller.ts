import { Controller, Post, Body, Headers, HttpCode, Logger, BadRequestException } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { MercadoPagoService } from './mercado-pago.service';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        private readonly pagamentosService: PagamentosService,
        private readonly mercadoPagoService: MercadoPagoService,
    ) {}

    /**
     * Recebe notificações do Mercado Pago
     * POST /webhooks/mercadopago
     */
    @Post('mercadopago')
    @HttpCode(200)
    async handleMercadoPagoWebhook(
        @Body() body: any,
        @Headers('x-signature') xSignature: string,
        @Headers('x-request-id') xRequestId: string,
        @Headers() headers: any,
    ) {
        // Log completo de tudo que chega
        this.logger.log('========== WEBHOOK MERCADO PAGO ==========');
        this.logger.log(`Body recebido: ${JSON.stringify(body, null, 2)}`);
        this.logger.log(`Headers recebidos: ${JSON.stringify(headers, null, 2)}`);
        this.logger.log(`x-signature: ${xSignature}`);
        this.logger.log(`x-request-id: ${xRequestId}`);
        this.logger.log('==========================================');

        // Extrai o data.id do query parameter ou body
        const dataId = body?.data?.id;

        if (!dataId) {
            this.logger.warn('Webhook sem data.id');
            return { success: true }; // Retorna 200 mesmo assim
        }

        // Valida assinatura (em produção, descomente isso)
        // if (process.env.NODE_ENV === 'production') {
        //     const isValid = this.mercadoPagoService.validateWebhookSignature(
        //         xSignature,
        //         xRequestId,
        //         dataId,
        //     );

        //     if (!isValid) {
        //         throw new BadRequestException('Assinatura inválida');
        //     }
        // }

        // Processa o webhook
        await this.pagamentosService.processWebhook(body);

        // IMPORTANTE: Retorna 200/201 dentro de 22 segundos
        return { success: true };
    }
}

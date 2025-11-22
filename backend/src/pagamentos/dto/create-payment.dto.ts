import { IsString, IsNumber, IsEmail, IsOptional, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PayerIdentificationDto {
    @IsString()
    type!: string; // CPF, CNPJ, etc

    @IsString()
    number!: string;
}

class PayerDto {
    @IsEmail()
    email!: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => PayerIdentificationDto)
    identification?: PayerIdentificationDto;
}

/**
 * DTO para criar pagamento de ASSINATURA DO RESTAURANTE
 * Não é para pagamento de pedidos dos clientes!
 * 
 * NOTA: Aceita campos em camelCase (do frontend) ou snake_case (backend)
 */
export class CreatePaymentDto {
    // Aceita ambos os formatos
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    transaction_amount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    transactionAmount?: number;

    @IsString()
    token!: string; // Token do cartão gerado pelo frontend

    @IsString()
    description!: string; // Ex: "Assinatura Mensal - Garçom"

    @IsInt()
    @Min(1)
    installments!: number;

    // Aceita ambos os formatos
    @IsOptional()
    @IsString()
    payment_method_id?: string;

    @IsOptional()
    @IsString()
    paymentMethodId?: string;

    @ValidateNested()
    @Type(() => PayerDto)
    payer!: PayerDto;

    @IsOptional()
    @IsInt()
    @Min(1)
    planDurationMonths?: number; // Duração do plano (default: 1 mês)

    @IsOptional()
    @IsString()
    external_reference?: string; // Referência do plano
}


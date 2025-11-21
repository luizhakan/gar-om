import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class AtualizarAssinaturaDto {
    @IsOptional()
    @IsEnum(SubscriptionStatus)
    subscriptionStatus?: SubscriptionStatus;

    @IsOptional()
    @IsDateString()
    trialEndsAt?: string;

    @IsOptional()
    @IsString()
    planLabel?: string;

    @IsOptional()
    @IsString()
    mercadoPagoCustomerId?: string;

    @IsOptional()
    @IsString()
    mercadoPagoSubscriptionId?: string;

    @IsOptional()
    @IsEmail()
    billingEmail?: string;

    @IsOptional()
    @IsString()
    billingPhone?: string;

    @IsOptional()
    @IsBoolean()
    blocked?: boolean;
}

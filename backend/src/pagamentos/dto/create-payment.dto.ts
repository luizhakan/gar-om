import { IsString, IsOptional, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PayerIdentificationDto {
    @IsString()
    type!: string;

    @IsString()
    number!: string;
}

class PayerDto {
    @IsString()
    email!: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => PayerIdentificationDto)
    identification?: PayerIdentificationDto;
}

export class CreatePaymentDto {
    @IsString()
    token!: string;

    @IsString()
    planCode!: string; // 'mensal' | 'trimestral' | 'anual' | 'founder'

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    @Min(1)
    installments!: number;

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
    @IsString()
    external_reference?: string;
}

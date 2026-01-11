import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class TrocarMesaDto {
    @IsInt()
    @Min(1)
    @IsNotEmpty()
    numeroMesa!: number;
}

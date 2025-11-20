import { IsIn, IsString } from 'class-validator';

export class AtualizarStatusDto {
    @IsString()
    @IsIn(['pendente', 'preparando', 'pronto'])
    status!: 'pendente' | 'preparando' | 'pronto';
}

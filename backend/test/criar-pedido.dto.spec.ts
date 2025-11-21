import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CriarPedidoDto } from 'src/pedidos/dto/criar-pedido.dto';
import { ItemPedidoDto } from 'src/pedidos/dto/item-pedido.dto';

describe('CriarPedidoDto (Segurança)', () => {
    
    it('deve falhar se o pedido tiver mais de 50 itens (Proteção DoS)', async () => {
        const dto = new CriarPedidoDto();
        dto.idMesa = 'mesa-1';
        
        // Gera 51 itens
        dto.itens = Array.from({ length: 51 }, (_, i) => {
            const item = new ItemPedidoDto();
            item.idProduto = `prod-${i}`;
            item.quantidade = 1;
            return item;
        });

        const errors = await validate(dto);
        
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('itens');
        expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
        expect(errors[0].constraints?.arrayMaxSize).toContain('não pode ter mais de 50 itens');
    });

    it('deve passar com 50 itens ou menos', async () => {
        const dto = new CriarPedidoDto();
        dto.idMesa = 'mesa-1';
        
        // Gera 50 itens (limite máximo permitido)
        dto.itens = Array.from({ length: 50 }, (_, i) => {
            const item = new ItemPedidoDto();
            item.idProduto = `prod-${i}`;
            item.quantidade = 1;
            return item;
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deve falhar se array de itens estiver vazio', async () => {
        const dto = new CriarPedidoDto();
        dto.idMesa = 'mesa-1';
        dto.itens = [];

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayMinSize');
    });
});
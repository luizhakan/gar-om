# 🔊 Guia de Teste do Alerta Sonoro

## Como Testar o Sistema de Alerta da Cozinha

### Passo 1: Acessar o Painel da Cozinha
1. Abra o navegador em: `http://localhost:5173/cozinha`
2. **IMPORTANTE:** Clique em qualquer lugar da página para ativar o AudioContext (navegadores bloqueiam áudio sem interação do usuário)

### Passo 2: Aguardar o Pedido de Teste
- Após **5 segundos**, um pedido de teste será criado automaticamente
- Você verá:
  - ✅ Barra vermelha no topo da tela (pulsante)
  - ✅ Card do pedido com borda vermelha pulsando
  - ✅ Badge "Novos" com número 1
  - 🔊 **SOM DE BEEP** tocando a cada 1 segundo

### Passo 3: Verificar o Console
Abra o DevTools (F12) e veja os logs:
```
[DEBUG][adicionarPedido] Novo pedido recebido: {...}
[DEBUG][useAlertaSonoro] Iniciando alerta sonoro
[DEBUG][useAlertaSonoro] Beep tocado
[DEBUG][useAlertaSonoro] Beep tocado
...
```

### Passo 4: Confirmar Recebimento
1. Clique no botão **"✓ Confirmar Recebimento"**
2. O som deve **parar imediatamente**
3. A barra vermelha desaparece
4. O card muda para borda laranja (status "preparando")

### Passo 5: Marcar como Pronto
1. Clique em **"✓ Marcar como Pronto"**
2. O pedido sai da lista

---

## 🐛 Troubleshooting

### "Não ouço nenhum som"

**Causa 1: AudioContext bloqueado**
- Solução: Clique em qualquer lugar da página antes do pedido chegar

**Causa 2: Volume do sistema baixo**
- Solução: Aumente o volume do sistema

**Causa 3: Navegador bloqueou áudio**
- Solução: Verifique o ícone de som na barra de endereço do navegador
- Chrome: Clique no ícone de cadeado → Permitir som

**Causa 4: Erro no console**
- Solução: Abra o DevTools (F12) e veja se há erros vermelhos

### "O som não para quando confirmo"

- Verifique se o botão "Confirmar Recebimento" está sendo clicado
- Veja no console se aparece: `[DEBUG][useAlertaSonoro] Parando alerta sonoro`

---

## 🎵 Características do Som

- **Frequência:** 800 Hz (tom médio-agudo)
- **Duração:** 250ms por beep
- **Intervalo:** 1 segundo entre beeps
- **Volume:** 30% (0.3)
- **Tipo:** Onda senoidal (som suave)

---

## 🔧 Personalização

Para mudar o som, edite `frontend/src/hooks/useAlertaSonoro.ts`:

```typescript
// Mudar frequência (tom mais grave ou agudo)
oscillator.frequency.value = 600; // Mais grave
oscillator.frequency.value = 1000; // Mais agudo

// Mudar intervalo entre beeps
intervaloRef.current = window.setInterval(() => {
  tocarBeep();
}, 500); // Mais rápido (0.5s)

// Mudar volume
gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05); // Mais alto
```

---

## 📱 Teste em Produção

Para simular um pedido real:
1. Abra outra aba: `http://localhost:5173/mesa/1`
2. Adicione produtos ao carrinho
3. Clique em "Ver Comanda"
4. Clique em "Enviar para Cozinha"
5. **NOTA:** Atualmente o pedido não é enviado para a cozinha (falta integração)
6. Por isso usamos o pedido de teste automático

---

**Última atualização:** 19/11/2025

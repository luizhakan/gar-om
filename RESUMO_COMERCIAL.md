# 🍽️ Garçom Ágil — Resumo Comercial e Técnico

Este documento apresenta um raio-X completo da plataforma **Garçom Ágil** para subsidiar decisões estratégicas e comerciais de vendas, parcerias e roadmap de produto.

---

## 💡 O que é o Garçom Ágil?

O **Garçom Ágil** é um sistema **SaaS (Software as a Service) B2B** focado na automação de pedidos e comandas para restaurantes, bares, lanchonetes e similares. A plataforma elimina a dependência exclusiva de garçons para atendimento básico: o cliente senta à mesa, escaneia um QR Code e gerencia seu próprio pedido e sua comanda diretamente de seu dispositivo móvel (sem necessidade de instalar aplicativos).

O modelo de negócios é focado na cobrança de uma **assinatura mensal/anual recorrente** dos estabelecimentos comerciais para o uso da plataforma.

---

## 🏗️ Níveis de Acesso e Atores do Sistema

O sistema é estruturado em quatro interfaces integradas em tempo real via WebSockets:

1. **Painel Master (Gestão do SaaS):**
   - Acessível em `/master`.
   - Utilizado pelo dono da plataforma (você) para controlar os restaurantes parceiros.
   - Permite visualizar dados de contato, datas de trials, status financeiro e bloquear/desbloquear estabelecimentos manualmente.
2. **Painel Admin do Restaurante (Gestão do Estabelecimento & Caixa):**
   - Acessível em `/admin`.
   - Permite o cadastro do restaurante com validação automatizada de CPF (iniciando em 14 dias de Trial gratuito).
   - Gerenciamento completo do cardápio (criação de categorias, cadastro de produtos com foto/preço e controle instantâneo de disponibilidade de itens).
   - Geração de QR Codes individuais para as mesas.
   - Controle de comandas e gerenciamento em tempo real dos dispositivos autorizados para cada comanda.
   - Gerenciamento da assinatura do estabelecimento via checkout integrado (planos Mensal, Trimestral e Anual).
3. **Painel da Cozinha:**
   - Acessível em `/cozinha`.
   - Painel limpo e direto para os cozinheiros/preparadores.
   - Recebe pedidos das mesas instantaneamente e permite atualizar o status (`pendente` -> `preparando` -> `pronto`).
4. **Interface do Cliente (Mesa):**
   - Acessível via escaneamento do QR Code da mesa.
   - Exibição de cardápio digital moderno e responsivo.
   - Abertura de comandas com código de acesso seguro de 6 caracteres.
   - Adição de itens ao carrinho de compras e envio direto para a fila de produção da cozinha.
   - Acompanhamento do status de preparo dos pratos em tempo real.
   - Solicitação de fechamento de conta.

---

## ✅ Funcionalidades Atuais (O que já está implementado)

- **Multi-tenancy Total:** O banco de dados isola rigidamente todos os dados de cada restaurante utilizando o cabeçalho `x-restaurante-id`.
- **Comanda Compartilhada Multi-dispositivos:** Permite que várias pessoas na mesma mesa façam pedidos juntas na mesma comanda. O primeiro a abrir a comanda torna-se o dispositivo "Master" e deve aprovar na tela dele a entrada de novos celulares na comanda (evitando que clientes de outras mesas acessem comandas alheias).
- **Troca de Mesa com Sincronização:** Caso os clientes mudem de mesa física, o sistema permite que o administrador transfira a comanda de mesa, atualizando instantaneamente as conexões de WebSocket e os pedidos em andamento.
- **Sincronização em Tempo Real:** Atualizações automáticas de status de pedidos e solicitações de mesa usando WebSockets.
- **Assinatura SaaS Automatizada via Mercado Pago:**
  - Fluxo de cobrança recorrente integrado ao Checkout Pro do Mercado Pago (suporta Pix, Boleto e Cartão).
  - Webhooks que processam o pagamento e renovam a assinatura do restaurante de forma automática.
  - Bloqueio automático de acesso ao painel do restaurante em caso de inadimplência.
- **Resiliência Offline (Mocks e Fallback):** Caso o backend da aplicação esteja fora do ar, o frontend conta com um sistema de fallback inteligente em `localStorage` para exibição e testes mockados.

---

## 📈 O que poderia ter (Roadmap & Oportunidades Comerciais)

Para tornar o produto ainda mais irresistível no mercado de food service e aumentar o ticket médio da plataforma, listamos módulos e melhorias de alto valor comercial:

### 1. Pagamento Direto na Mesa via PIX (Split ou Individual)
- **O que é:** Permitir que o cliente pague o valor total ou parcial de sua comanda diretamente do celular através de um Pix dinâmico gerado pelo app.
- **Diferencial de Venda:** Reduz drasticamente as filas no caixa e acelera o giro de mesas, diminuindo a necessidade de mão de obra direta para cobrança.

### 2. Divisão de Conta Inteligente (Split de Comanda)
- **O que é:** Permitir que os participantes da mesma comanda dividam a conta (igualmente ou pagando apenas o que consumiram) diretamente pelo celular.
- **Diferencial de Venda:** Resolve uma das maiores dores de cabeça de atendimento em mesas com grandes grupos de amigos.

### 3. Integração com Impressoras Térmicas (KDS Físico)
- **O que é:** Envio automático de cupons de pedidos para impressoras térmicas na cozinha ou no bar (protocolos ESC/POS).
- **Diferencial de Venda:** Essencial para restaurantes tradicionais que possuem operação focada em comandas físicas de papel para a cozinha.

### 4. Módulo de Pesquisa de Satisfação (NPS) e Avaliação de Pratos
- **O que é:** Ao encerrar a comanda, o cliente dá uma nota para o atendimento e para a comida no celular.
- **Diferencial de Venda:** Fornece relatórios de qualidade e gestão para os donos dos restaurantes avaliarem seus funcionários e pratos.

### 5. Fidelidade e Cashback do Estabelecimento
- **O que é:** Mecanismo onde o cliente acumula pontos ou saldo a cada pedido no restaurante para trocar por descontos em visitas futuras.
- **Diferencial de Venda:** Excelente argumento comercial baseado na retenção e fidelização de clientes para os restaurantes parceiros.

### 6. Integração com Whatsapp (Cardápio Delivery)
- **O que é:** Permitir que o restaurante use o mesmo cardápio para receber pedidos de entrega por link do WhatsApp, sem pagar taxas para grandes aplicativos (iFood).
- **Diferencial de Venda:** Expande a utilidade do Garçom Ágil de um sistema de mesa para um sistema completo de delivery.

### 7. Dashboard de Inteligência e Recomendação de Vendas
- **O que é:** Gráficos e inteligência artificial indicando pratos mais vendidos, horários de pico, previsão de faturamento e sistema de "compre junto" (cross-selling, ex: "clientes que pediram este hambúrguer também pediram este milk-shake").
- **Diferencial de Venda:** Agrega valor estratégico à ferramenta, ajudando o restaurante a vender mais e reduzir desperdício de estoque.

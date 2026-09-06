# Interface principal de conversa

## Escopo desta entrega

Layout e navegação sobre a base das correções de importação e juros. A tela inicial é Conversa; não existe integração de IA, requisição de chat, chave de API, conversa simulada ou alteração por linguagem natural.

## Experiência

- Resumo compacto: saldo registrado, compromissos do mês e projeção do mês selecionado.
- A área de conversa identifica claramente que a assistente está indisponível. Campo e envio desativados.
- Atalhos funcionais abrem cadastro de movimentação, dívidas e projeção.
- Contas mostra vencimentos e pagamentos. Dívidas tem cadastro direto e simulador. Histórico mantém as movimentações existentes. Projeção mantém os detalhes financeiros.
- Cadastro, importação, exportação, edição e exclusão existentes são preservados.
- Valores vêm do estado atual do app; não há saldo bancário conectado. O resumo não chama a projeção mensal de dinheiro seguro até a próxima renda, pois esse cálculo ainda não existe.
- Texto legível, layout responsivo, rótulos de navegação e foco visível por teclado. Não foi realizado teste visual em navegador.

## Integração posterior (não implementada)

A assistente deverá consultar dados atuais do usuário, conhecer destinos de navegação e realizar operações controladas com resultado verificável. Pedidos claros poderão executar ações reversíveis com histórico e possibilidade de desfazer; pedidos ambíguos precisam de esclarecimento. Isso não concede capacidade de movimentação bancária.

Antes de conectar IA: autenticação e banco, contratos de operações, autorização por usuário, limites de uso no servidor e registro das alterações. O histórico de movimentações atual não é um histórico de ações da IA.

## Validação

TypeScript e build Vite de produção concluídos. Nenhuma alteração nas regras financeiras nesta entrega. Nenhum serviço pago, IA do Lovable ou publicação foi ativado.

## Dependência

Esta alteração parte da branch fix/importacao-e-simulacao (PR #2). Incorporar as correções antes da interface. Preservar a implementação React recebida do Google; não trazer a antiga interface JavaScript da primeira proposta por cima desta versão.

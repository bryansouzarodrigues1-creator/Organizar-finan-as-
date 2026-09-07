# Produto

## Visão expressa pelo fundador

Criar um app funcional de organização financeira, com IA para ajudar a pessoa com seus problemas e dívidas. Evoluir para planos com assistência mais capaz e personalizada e, posteriormente, apoio a metas de longo prazo e liberdade financeira. A experiência deve gerar resultado percebido e vontade de recomendar, inclusive pelo status.

## Proposta de primeira versão — a validar

Público inicial: pessoas que precisam entender o que entra, o que sai e quais contas precisam pagar.

Perguntas que o produto deve responder:
1. Quanto dinheiro tenho agora?
2. Quais contas e dívidas vencem em seguida?
3. Quanto ficará disponível depois dos compromissos registrados?

Fluxo mínimo:
1. Informar saldo inicial e receitas.
2. Cadastrar despesas e compromissos com valor, vencimento e situação.
3. Registrar dívidas com saldo devedor informado, parcelas e juros quando conhecidos.
4. Ver resumo do mês e próximos vencimentos.
5. Registrar pagamentos e acompanhar a evolução.

## Regras essenciais

- Distinguir saldo atual de projeção; receita prevista não é dinheiro recebido.
- Não descontar uma mesma parcela duas vezes ao registrar o pagamento de uma dívida.
- Distinguir saldo total da dívida e parcelas do mês.
- Permitir corrigir e excluir registros com atualização dos totais.
- Indicar quando faltam informações para calcular uma projeção.
- Usar cálculos determinísticos para valores; uma resposta de IA não é o registro financeiro oficial.
- Interface inicial em português do Brasil e valores em reais.
- Salvar os registros e recuperá-los ao retornar; contas diferentes não podem acessar dados umas das outras.

## Critérios de aceite propostos

- Cadastro, edição, pagamento e exclusão refletem corretamente nos totais.
- Dados persistem após fechar e reabrir o app.
- Um pagamento de parcela reduz o saldo disponível e atualiza a dívida uma única vez.
- Sem lançamentos, a interface orienta a começar e não inventa números.
- Projeção informa o período e as entradas e saídas consideradas.
- Uma pessoa consegue completar o fluxo principal pelo celular.

## Fora da primeira entrega

Integração bancária, investimentos automatizados, múltiplas moedas, gamificação, rede social e vários planos pagos. A IA faz parte da visão e será incorporada depois de estabelecer uma base financeira confiável.

## Validação comercial

Testar com pessoas reais se entendem o saldo e os próximos compromissos, voltam para registrar movimentações e pagariam pela ajuda. Relatos compartilhados devem ser voluntários e verdadeiros. Não prometer quitação de dívidas, riqueza ou liberdade financeira garantidas.

## Escopo atualizado pelo fundador

Prioridade em saldo projetado, estratégia de dívidas e redução do cadastro manual. A interface principal é conversa, com dados resumidos e telas próprias de Contas, Dívidas e Histórico. Open Finance de leitura e PWA agora fazem parte da preparação solicitada; seguem desativados para uso real até configurar e validar a infraestrutura. A IA permanece fora desta entrega. Detalhes em pwa-openfinance.md.

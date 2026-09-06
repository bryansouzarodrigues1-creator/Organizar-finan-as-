# Próxima etapa no Lovable

## Decisões do responsável

Começar com a franquia gratuita do Lovable, usando Lovable Cloud para banco e autenticação e IA integrada para assistência. Não contratar API própria da OpenAI nem outros serviços pagos antes de validar demanda. Limitar o piloto ao que a franquia comportar; não prometer uso ilimitado.

## GitHub: ordem correta

A documentação consultada em 2026-09-06 informa que Lovable não importa um repositório existente. A conexão de um projeto Lovable cria um NOVO repositório no GitHub, com sincronização em duas direções.

Fonte: https://docs.lovable.dev/integrations/github (seções Link a project e Limitations).

1. Criar o projeto no Lovable usando o briefing abaixo.
2. Conectar esse projeto ao GitHub e obter o link do repositório que ele criar.
3. Reaproveitar o núcleo financeiro e os testes deste repositório no novo projeto, adaptando imports e interface à estrutura gerada. Não sobrescrever a configuração do Lovable.
4. Transferir a documentação e registrar o novo repositório como fonte central. Preservar o antigo como histórico, sem excluí-lo.

## Briefing para a primeira construção

Crie um aplicativo de organização financeira em português do Brasil, pensado para celular. Prioridade: facilidade de registro e contas corretas. Use Lovable Cloud para login e banco. Comece com saldo inicial, receitas, despesas, dívidas, vencimentos e pagamentos, incluindo pagamentos parciais. Mostre saldo atual, contas a pagar, saldo devedor e projeção claramente identificada. Permita editar e excluir com recálculo. Evite funções decorativas e não adicione investimentos, integração bancária ou cobranças nesta fase.

Valores devem ser inteiros em centavos; receitas previstas não entram no saldo atual. Uma parcela paga reduz caixa e dívida uma única vez. Vincule parcelas à dívida sem duplicar despesas. Mostre aviso quando faltarem vencimentos das dívidas. Pagamento deve ser transacional e idempotente no servidor. Cada usuário só acessa seus próprios registros; teste acesso entre duas contas com políticas de autorização no banco.

Use somente recursos da franquia gratuita disponível. Não habilite recarga automática nem recursos pagos. Se alguma operação exigir pagamento, informe antes. Primeiro entregue o fluxo financeiro persistente e testado. Depois adicione uma assistência pequena com IA integrada, acionada pelo usuário, lendo apenas seus dados autorizados. Defina e aplique limite de uso no servidor; trate fim dos créditos com mensagem clara, mantendo as funções financeiras disponíveis enquanto houver recursos de Cloud. Não simule respostas de IA nem use dados de exemplo como se fossem reais. Não exija uma chave de API própria da OpenAI.

## Critérios antes do piloto

- Persistência verificada ao sair e entrar em outro dispositivo.
- Duas contas não conseguem ler ou alterar dados uma da outra.
- Repetir uma requisição de pagamento não duplica efeito.
- Não há chaves secretas no navegador.
- Limites de IA não podem ser burlados pelo cliente.
- Custo/saldo da conta conferidos antes de convidar usuários.
- Revisão manual pelo fundador e correção de erros bloqueadores.

Documentação de referência: https://docs.lovable.dev/features/cloud e https://docs.lovable.dev/features/ai . Créditos e oferta podem mudar; verificar no painel da conta.

# Versão consolidada: conversa, PWA e preparação Open Finance

## O que está implementado

Unificação das alterações da main (4576173) com as correções do PR #2 e o layout do PR #3. Preserva confirmações de exclusão, feedback e separação dos meses. Corrige restauração e edição de pagamentos vinculados, marcador mensal, repetição de pagamento, limite do último pagamento, vencimento no último dia real do mês e histórico pela data de pagamento. Projeção histórica exclui valores ainda pendentes. A média diária não é anunciada como gasto seguro.

A IA continua desconectada.

## PWA

- Manifest com modo standalone, ícones 192/512 e suporte à tela inicial.
- Controle de instalação quando o navegador permitir e instruções alternativas.
- Service worker gerado após cada build, com versão baseada nos arquivos.
- Cache limitado à interface estática. Não intercepta APIs, domínios externos, consultas com parâmetros ou chamadas que não sejam GET.
- Interface e registros manuais locais funcionam offline após o primeiro carregamento completo. Banco exige internet. Offline não equivale a backup ou sincronização de dados.
- Atualizações aguardam confirmação para não recarregar um formulário silenciosamente.
- Hospedar dist/ em HTTPS, no caminho raiz. Servir sw.js sem cache duradouro. O aplicativo não foi publicado nesta tarefa.

## Banco: adaptador inicial Pluggy

A integração é código preparado, não uma conexão ativa. Nenhum serviço contratado, chave real inserida ou conta bancária conectada.

Arquivos:
- src/components/BankConnections.tsx: login do aplicativo, início da autorização, consulta por conta/cartão, categorias em reais e descrições/estabelecimentos retornados.
- src/utils/bankClient.ts: chamadas autenticadas ao servidor, sem chave privada do provedor.
- supabase/functions/open-finance/index.ts: endpoint com autenticação, controle de origem/uso, token de conexão, vínculo verificado, consulta e desconexão.
- supabase/functions/_shared/bank-domain.ts: validação de dono, consentimento, paginação e normalização.
- supabase/migrations/202609060001_bank_connections.sql: conexões, snapshots e limite de requisições, com RLS.

As consultas bancárias são separadas dos lançamentos manuais para não somar compras de cartão e pagamento da fatura como duas despesas. Cartão e conta também são apresentados separadamente. Categorias podem exigir correção; o nome do estabelecimento só aparece se o provedor o informar. Não inferimos localização geográfica a partir de um Pix. Débitos por categoria são brutos; créditos e estornos aparecem na lista.

## Ativação no projeto Lovable/Supabase — pendente

1. Criar/conectar o projeto Lovable e obter seu repositório sincronizado. Migrar esta base preservando as configurações que ele gerar; Lovable cria outro repositório, não importa este pelo fluxo Git sync.
2. Aplicar a migração SQL e configurar autenticação do aplicativo. Confirmar políticas de e-mail, cadastro e redirecionamento.
3. Criar o ambiente de testes do provedor escolhido. Pluggy é o adaptador inicial; condições comerciais e cobertura dos bancos precisam ser confirmadas antes do uso real.
4. Configurar somente no servidor: PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET, PLUGGY_CONNECTOR_IDS (lista de conectores regulados de sandbox), BANK_MODE=sandbox, APP_ORIGIN (origem HTTPS exata, sem barra final). SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ficam exclusivamente no servidor.
5. Publicar a Edge Function open-finance com verificação JWT. No frontend: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_BANK_ENABLED=true. A chave anon/publicável não é a service-role.
6. Validar em sandbox com duas contas do aplicativo: autorização/cancelamento, acesso cruzado negado, conexão, consulta, paginação, consentimento revogado/expirado, logout e desconexão. Testar a aplicação SQL/RLS no banco real do projeto, não apenas o código.
7. Testar instalação e atualizações PWA no Android e iOS, incluindo redirecionamento bancário. Só então avaliar conectores de produção e custos com o fundador. Não ativar recarga automática ou planos pagos sem autorização.

O servidor recusa conectores diretos que não sejam Open Finance e confere ambiente e lista permitida. Configure também os produtos permitidos no painel do provedor: somente contas/cartões/transações. O checkbox do app não substitui o consentimento dado na instituição. A senha do banco não é coletada pelo nosso formulário de autenticação.

## Limites atuais do piloto

- Sem credenciais, deploy, aplicação da migração ou verificação com banco real.
- Snapshot mensal em BRL, até 10 contas e 20 páginas de 500 transações por conta; resposta incompleta não é salva. Limite de seis requisições por usuário/minuto e três conexões por usuário. Confirmar quotas comerciais separadamente.
- Consultas reutilizam snapshot por até 15 minutos após verificar consentimento; não forçam atualização instantânea na instituição.
- Sem webhooks e sem recuperação automática de autorização que termina depois de fechar o widget. Bancos com autorização assíncrona precisam dessa etapa antes do lançamento. Renovação dedicada de consentimento também permanece pendente.
- Sessão da consulta fica em memória; logout limpa a consulta da tela. Dados bancários ficam no servidor e não entram no backup JSON manual. Dados manuais continuam locais e não isolados por login; não tratar esta base como produto multiusuário completo.
- Desconectar solicita exclusão do item ao provedor e remove conexões/snapshots locais. Orientar o usuário a revisar consentimentos no banco; não afirmar revogação bancária sem verificá-la.
- Testes do endpoint usam serviços simulados. Migração SQL/RLS, execução no Deno/Supabase, widget real e instalação móvel ainda não foram executados.

## Verificação executada

npm run build && npm test: TypeScript/Vite concluídos e 29 testes aprovados. Inclui regressões financeiras, importação, isolamento no handler, autenticação ausente, origem negada, consentimento, paginação, sinais de cartão/conta, PNGs/manifest e fronteira do cache offline. Não houve teste visual em navegador.

## Referências oficiais consultadas

- https://docs.pluggy.ai/docs/authentication
- https://docs.pluggy.ai/docs/environments-and-configurations
- https://docs.pluggy.ai/reference/transactions-list-by-cursor
- https://docs.pluggy.ai/docs/transactions
- https://docs.pluggy.ai/docs/consents
- https://docs.pluggy.ai/reference/consents-list
- https://docs.pluggy.ai/reference/accounts-list
- https://docs.lovable.dev/integrations/supabase
- https://docs.lovable.dev/integrations/github

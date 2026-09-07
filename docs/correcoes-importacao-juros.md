# Correções de importação e simulação

## Escopo

Correção sobre a implementação React recebida do Google AI Studio. Preserva a estrutura atual e não altera serviços ou publica o aplicativo.

## Importação

- OFX: identidade por banco, agência, conta, tipo de conta e FITID. Importar novamente ou importar períodos sobrepostos não repete o mesmo identificador.
- Sem FITID: identidade por conta, data, tipo, valor, descrição normalizada e ocorrência. Texto colado usa identidade equivalente, sem conta.
- Compras iguais com FITIDs distintos são preservadas. Linhas idênticas sem FITID preservam sua multiplicidade no mesmo arquivo.
- Registros do importador antigo (IDs tx-bank-) sem identidade são comparados conservadoramente por data, tipo, valor e descrição. Correspondências são ignoradas; registros antigos editados podem exigir conciliação manual.
- Identidade é preservada ao editar um lançamento importado.
- Datas e valores inválidos impedem a importação; não são substituídos silenciosamente por hoje.
- Texto exige uma data e um único valor brasileiro por linha; linhas ambíguas são recusadas. Categorias são sugestões por palavras-chave.
- Troca de aba, alteração do texto e fechamento limpam a prévia. Leituras de arquivo obsoletas não substituem a prévia atual.

Limites: importações por formatos diferentes não são conciliadas automaticamente. Sem FITID, arquivos sobrepostos com compras idênticas são ambíguos; a comparação conservadora pode ignorar uma compra legítima idêntica. Texto não distingue contas. Ainda não há conciliação de estornos, correções bancárias ou transferências internas. Isso deve ser resolvido antes da sincronização bancária real. A interface informa os limites; nenhuma compatibilidade universal com bancos é prometida.

## Open Finance

Retirados os bancos demonstrativos e a função que acrescentava lançamentos fictícios. A tela informa que conexão real está indisponível e não permite confirmar importação nessa aba. Não foram criados provedor, consentimento, credenciais ou acesso bancário.

## Juros

Substituída a heurística de meses economizados × saldo × taxa × 0,7 por amortização mês a mês. Hipóteses: saldo principal sem juros futuros, taxa mensal fixa, pagamento fixo ao fim do mês, juros arredondados a cada mês em centavos, último pagamento limitado ao saldo. Cálculo intermediário em BigInt; taxa com precisão de seis casas percentuais. Comparação usa o mesmo modelo nos dois cenários.

Taxa ausente bloqueia simulação; zero permanece zero. Texto livre não é interpretado automaticamente como taxa mensal (pode ser anual ou CET). Parcela que não cobre juros e prazo acima de 1.200 meses geram aviso. Sem tarifas, seguros, indexação ou regras específicas de antecipação do contrato. Valores apresentados são estimativas condicionais, não economia contratual garantida.

## Verificação

Testes automatizados cobrem repetição/ sobreposição de importações, identidade entre contas, compras idênticas, registros antigos, fallback sem FITID, parsing inválido, taxa zero/ausente, amortização conhecida e parcela insuficiente. Build de produção e TypeScript verificados. Não realizado teste visual em navegador.

## Pendências fora desta correção

Armazenamento continua no navegador; autenticação e banco do Lovable não estão conectados. A projeção ainda requer revisão de fluxo de caixa por data antes de ser tratada como gasto diário seguro. A implementação recebida não deve ser anunciada como integração bancária completa.

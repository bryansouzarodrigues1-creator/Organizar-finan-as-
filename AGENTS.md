# Orientações para agentes

## Prioridade

Construir uma ferramenta que ajude a organizar finanças de verdade. Favorecer clareza, cálculos corretos e persistência. Ler README.md, docs/produto.md, docs/roadmap.md e docs/colaboracao.md antes de trabalhar.

## Escopo

- Implementar somente a etapa solicitada pelo responsável.
- Distinguir propostas, decisões aprovadas e funcionalidades implementadas.
- Não escolher ou substituir a estrutura técnica silenciosamente.
- Manter texto de interface em português do Brasil.
- Não afirmar que algo funciona sem verificar.

## Dinheiro e dados

- Representar dinheiro em centavos inteiros ou decimal exato.
- Separar movimentações realizadas, previsões e saldo devedor.
- Evitar duplicação de pagamentos e lançamentos.
- Cobrir com verificações significativas cálculos financeiros, persistência e autorização quando implementados.
- Usar dados fictícios em exemplos e testes.
- Nunca versionar credenciais, dados financeiros reais ou arquivos de ambiente com segredos.
- Manter chaves de IA no servidor quando houver integração.

## Colaboração

- Examinar o estado atual antes de editar e preservar mudanças existentes.
- Preferir tarefas pequenas e branches próprias quando suportadas.
- Não sobrescrever histórico nem usar force push.
- Documentar decisões e pendências para a próxima ferramenta.
- Não publicar o aplicativo, criar cobrança ou contratar serviços sem instrução correspondente.

## IA futura

Usar cálculos verificáveis como fonte dos valores. Explicitar dados ausentes. Pedir confirmação antes de mudar registros financeiros. Não prometer resultados financeiros garantidos.

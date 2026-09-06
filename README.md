# Organizar finanças

Aplicativo em planejamento para ajudar pessoas a entender suas contas, organizar dívidas e acompanhar o progresso financeiro.

## Direção do produto

A prioridade é utilidade real: a pessoa precisa conseguir organizar suas finanças e perceber resultado suficiente para querer recomendar o app. Aparência deve facilitar o uso; quantidade de funções não é objetivo. Vendas e resultados ainda precisam ser validados com usuários.

## Estado atual

Aplicativo executável implementado no Google AI Studio (Vite + React + TypeScript + Tailwind CSS) cobrindo o fluxo funcional da primeira versão descrita em `docs/produto.md`:
- Representação determinística de valores monetários em centavos inteiros.
- Separação entre saldo em caixa realizado, receitas previstas, contas pendentes e saldo devedor de longo prazo.
- Prevenção de pagamento duplicado na baixa de parcelas de dívidas.
- Persistência local (armazenamento no navegador com suporte a exportação/importação de backup em JSON).
- Carregamento opcional de dados fictícios para testes e validação.

## Documentação

- [Produto e critérios da primeira versão](docs/produto.md)
- [Etapas de evolução](docs/roadmap.md)
- [Colaboração entre ferramentas](docs/colaboracao.md)
- [Orientações para agentes](AGENTS.md)

## Próximo passo

Definir o fluxo principal e validar a integração da ferramenta de construção com este repositório antes de escolher a estrutura técnica.

Nome comercial, tecnologias, preços e provedor de IA ainda não estão definidos.

## Importação e simulações

Importação OFX/texto é manual; Open Finance real ainda não está conectado. Veja [correções, hipóteses dos juros e limites de importação](docs/correcoes-importacao-juros.md).

Para validar: `npm ci`, `npm test` e `npm run build`. O arquivo de dependências travadas foi incluído para reproduzir a instalação.

# Colaboração entre ferramentas

## Fonte central

Este repositório é a fonte central dos arquivos e das decisões do projeto. Conversas relevantes devem ser convertidas em alterações na documentação para que outra ferramenta consiga continuar.

## Estado das conexões

- ChatGPT: acesso ao repositório verificado na preparação inicial.
- Google: ferramenta específica e acesso ainda não confirmados.
- Lovable: projeto ainda não conectado. O fluxo suportado cria um novo repositório; ver lovable.md.

Ter uma conta GitHub conectada em uma ferramenta não concede acesso às outras. Antes de iniciar código no Lovable, verificar na documentação atual qual fluxo de criação, importação ou sincronização é suportado. Não presumir que um repositório existente pode ser importado. Se for necessário outro fluxo, alinhar a migração antes de criar fontes concorrentes.

## Rotina de trabalho

1. Ler README.md, AGENTS.md e docs/produto.md.
2. Atualizar a cópia local antes de alterar arquivos.
3. Definir uma tarefa pequena com resultado verificável.
4. Trabalhar em uma branch própria quando a integração permitir e apresentar as mudanças em pull request.
5. Evitar duas ferramentas alterando os mesmos arquivos ao mesmo tempo.
6. Registrar o que mudou, a verificação feita e o que falta.
7. Atualizar o planejamento quando uma decisão for tomada.

Se uma ferramenta sincronizar diretamente na branch principal, coordenar uma ferramenta por vez e conferir as alterações antes de iniciar outra tarefa.

## Texto para iniciar uma tarefa em outra IA

Leia README.md, AGENTS.md e os documentos de docs/. Resuma o estado atual e execute apenas a tarefa solicitada. Preserve o foco no fluxo principal de organização financeira. Não invente integrações, decisões ou funcionalidades concluídas. Ao terminar, informe os arquivos alterados, como verificou a mudança e as pendências.

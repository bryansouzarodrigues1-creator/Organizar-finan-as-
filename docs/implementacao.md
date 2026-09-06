# Primeira implementação — 6 de setembro de 2026

## Entrega para revisão

Interface funcional em HTML/CSS/JavaScript nativo, sem dependências de terceiros. Núcleo financeiro puro em src/finance.js, reaproveitável em uma interface React do Lovable. Esta escolha mantém o código de domínio portátil enquanto o projeto Lovable ainda não existe.

Funciona nesta etapa: saldo inicial, receitas e despesas previstas ou realizadas, edição, exclusão, pagamento, cadastro de dívidas, vínculo manual de parcelas, saldo devedor, projeção do mês e filtro de lançamentos. Pagamentos parciais de uma dívida são lançamentos separados vinculados ao mesmo acordo; para pagar parte de uma parcela, edite-a para separar a parte paga e cadastre o restante como outro lançamento. Parcelamento automático não existe.

O saldo inicial representa a posição antes de TODOS os lançamentos cadastrados. As datas não alteram essa definição. Projeções incluem pendências vencidas de meses anteriores e compromissos até o último dia do mês atual. Não são previsão garantida de caixa. Dívidas sem parcelas geram aviso de projeção incompleta.

## Limites explícitos

- Somente protótipo local, para dados fictícios. localStorage é provisório, não é o banco de produção.
- Sem login, isolamento entre usuários, backup na nuvem ou sincronização entre dispositivos.
- Detecta alterações de outra aba e bloqueia edição até recarregar; não substitui controle transacional de concorrência no servidor.
- Sem IA, cobranças, juros automáticos, importação bancária ou parcelamento automático.
- Sem publicação. Nenhuma API paga ou serviço foi contratado.
- Testes automatizados do domínio e armazenamento executados. A interface ainda precisa de revisão manual em navegador/celular; não foi feito teste visual ou ponta a ponta.

## Executar

Node.js 20+ para testes. Python 3 para servir a interface, sem instalar dependências:

```sh
node --test
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra http://localhost:8000 no computador que executa o servidor. Não abra index.html diretamente via file://, pois há módulos JavaScript.

## Revisão do Google

Revisar src/finance.js, src/storage.js, src/app.js, index.html e tests/finance.test.js. Se a ferramenta não conseguir ler todos os arquivos no GitHub, anexar os arquivos; não presumir acesso.

Pedir revisão independente com severidade, arquivo, cenário reproduzível, resultado esperado e resultado observado. Diferenciar bug confirmado, hipótese e função ainda não implementada. Avaliar como usuário comum: entende o saldo inicial? Percebe que receita prevista não é saldo disponível? Consegue pagar parte de uma dívida sem duplicar despesa? O esforço de cadastro faria abandonar o app? Existe benefício pelo qual pagaria? Ser direto e crítico, sem inventar execução de testes.

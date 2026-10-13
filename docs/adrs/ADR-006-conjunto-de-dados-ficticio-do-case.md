# ADR-006: Conjunto de dados fictício do case por restrição do TAPI

**Data:** 13/10/2026
**Status:** Aceita
**Decisores:** Prof. José Romualdo, para as aulas do Prof. Ovidio Lopes da Cruz Netto

## Contexto

O acervo do M03 proibia dado sintético onde existisse dado aberto real. No M04 não existe fonte aberta para o case, e o TAPI da Cerradinho, na seção "Conteúdo restrito", classifica como restritos "cadastros de ativos e fornecedores, notas fiscais, localizações e rotas, prazos, custos" e determina, para repositórios públicos, "dados fictícios ou anonimizados". Os dados de remessas da última safra ainda não foram disponibilizados.

## Decisão

O case usa um conjunto fictício gerado por `tools/gerar_dados_case.py` com semente fixa, com invariantes travados em `tools/tests/test_dados_case.py`.

## Motivações

1. Cumpre a restrição do TAPI num repositório publicado inteiro no GitHub Pages.
2. Permite fixar as situações que o TAPI pede analisar separadamente: atraso frente ao prazo e permanência acima de 150 dias.
3. Todo número citado nas aulas sai de um arquivo regenerável.

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Aluno toma o dado fictício por real | todo artefato que usa `dados/` diz que o conjunto é fictício |
| Dado fictício com padrão irreal | invariantes do TAPI em teste; substituição por dado anonimizado da empresa quando houver, por nova ADR |

## Consequências

**Positivas:** Case completo desde a primeira aula, sem risco de vazar dado do parceiro.

**Negativas:** As conclusões numéricas valem para o exercício, não para a Cerradinho.

## ADRs relacionadas

ADR-003.

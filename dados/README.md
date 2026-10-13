# Dados do case Cerradinho

Todo valor desta pasta é fictício. O TAPI da Cerradinho, na seção "Conteúdo restrito", classifica
como restritos os cadastros de ativos e fornecedores, as notas fiscais, as localizações e rotas, os
prazos e os custos, e determina que atividades acadêmicas e repositórios públicos usem dados
fictícios ou anonimizados. Os dados de remessas da última safra também ainda não foram
disponibilizados pela empresa. A decisão está registrada na `docs/adrs/ADR-006`.

Os arquivos são gerados por `tools/gerar_dados_case.py`, com semente fixa (4042), e conferidos por
`tools/tests/test_dados_case.py`. Não editar à mão: regerar com

```bash
python3 tools/gerar_dados_case.py
```

## Data de referência

O conjunto representa a situação em **01/10/2026**. Ciclo sem `data_retorno` está aberto nessa
data, e "dias fora" é contado até ela.

## Arquivos e colunas

### `equipamentos.csv`

16 equipamentos, dentro da faixa de 10 a 20 que o MVP do TAPI pede.

| Coluna | Significado |
|---|---|
| `id_equipamento` | identificador fictício, de EQ-01 a EQ-16 |
| `tipo` | bomba centrífuga, redutor, motor elétrico, válvula de controle, cilindro hidráulico ou painel elétrico |
| `largura_m`, `altura_m`, `profundidade_m` | dimensões entre 0,6 e 1,4 m, em torno da referência de 1 × 1 × 1 m do TAPI |
| `massa_kg` | massa estimada |

### `fornecedores.csv`

| Coluna | Significado |
|---|---|
| `id_fornecedor` | FN-01 a FN-06 |
| `nome` | "Oficina Fictícia A" a "F" |
| `regiao` | Região 1, 2 ou 3, sem correspondência com lugar real |
| `prazo_medio_dias` | prazo combinado típico do fornecedor |

### `ciclos.csv`

Um ciclo é uma ida do equipamento à manutenção externa, do envio ao retorno.

| Coluna | Significado |
|---|---|
| `id_ciclo` | CI-001 em diante |
| `id_equipamento`, `id_fornecedor` | o que foi enviado e para quem |
| `id_dispositivo` | rastreador vinculado, de DV-01 a DV-08; o mesmo dispositivo é reutilizado em ciclos sucessivos, nunca em dois ao mesmo tempo |
| `nf_remessa`, `nf_retorno` | números de NF fictícios |
| `data_saida`, `prazo_previsto`, `data_retorno` | datas em ISO 8601; `data_retorno` vazio quando o ciclo está aberto |

### `leituras.csv`

Uma leitura por semana e por ciclo, como o TAPI pede ("localização e status uma vez por semana").

| Coluna | Significado |
|---|---|
| `id_ciclo`, `id_dispositivo` | a qual ciclo e rastreador a leitura pertence |
| `data_hora` | horário da leitura |
| `x_km`, `y_km` | posição num plano fictício em quilômetros, com a base na origem; não há latitude nem longitude, para não sugerir lugar real |
| `posicao_valida` | `False` quando o dispositivo não obteve posição; nesse caso a posição repete a última válida |
| `bateria_pct` | carga da bateria, que nunca sobe dentro de um ciclo |
| `rssi_dbm` | intensidade do sinal da última comunicação, entre -92 e -55 dBm |

### `eventos_lacre.csv`

| Coluna | Significado |
|---|---|
| `id_ciclo`, `id_dispositivo`, `data_hora` | quando e onde o evento aconteceu |
| `tipo` | `violacao` (retirada ou rompimento sem autorização), `retirada_autorizada` (exigida pelo reparo) ou `reaplicacao` (lacre reposto depois da retirada autorizada) |

## Três situações fixadas de propósito

O TAPI pede que o tempo de permanência e o atraso frente ao prazo combinado sejam analisados
separadamente. O gerador fixa três ciclos abertos para que as duas situações, e a situação normal,
sempre existam:

| Ciclo | Equipamento | Dias fora em 01/10/2026 | Prazo previsto | Situação |
|---|---|---|---|---|
| CI-003 | EQ-01 | 190 | 60 dias | permanência longa: passou do limiar de 150 dias |
| CI-009 | EQ-02 | 70 | 30 dias | atraso: passou do prazo, mas não do limiar |
| CI-015 | EQ-03 | 12 | 45 dias | no prazo |

Os demais 41 ciclos estão fechados e servem de histórico.

## Se a Cerradinho liberar dados reais

Dado anonimizado da empresa substitui este conjunto por nova ADR, mantendo as mesmas colunas, para
que laboratórios e animações continuem funcionando.

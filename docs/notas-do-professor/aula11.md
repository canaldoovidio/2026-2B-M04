# Notas do professor: Aula 11, 10/12/2026

Material interno de condução da aula. Perguntas para quando a sala trava, com a resposta
esperada e o erro que cada uma costuma revelar. A ordem segue os blocos do
`PLANEJAMENTO_AULA_A_AULA.md`.

## Antes de começar

- A ponderada é em grupo e em sala, com o enunciado e o barema da reescrita 5C
  (`PLANO_DE_ENSINO.md`, seção 6.4). A Adalove tem barema próprio, com outra distribuição; o acervo
  segue a reescrita 5C (ADR-007). Confirmar com o professor responsável antes de aplicar.
- O código sob análise é o servidor web local do ESP32 do roteiro do encontro
  (randomnerdtutorials.com/esp32-web-server-arduino-ide). A análise é estática. O "ir além" pede
  executar um ataque no ESP32 do próprio grupo: lembrar que o teste só vale em dispositivo próprio,
  na rede da sala.
- Conferir que cada grupo escreve o modelo de ameaça antes de abrir o código e antes de consultar a
  IA, e que a lista bruta da IA vai inteira para o relatório. Sem ela, o item Confrontar vale zero.
- A escala de risco de 1 a 3 (probabilidade e impacto) é adaptação do acervo; o enunciado não fixa
  escala. Mostrar o slide da escala antes de os grupos preencherem a tabela da turma.
- Medições do acervo em 13/10/2026, para responder perguntas sobre o broker: `broker.hivemq.com:8883`
  negocia TLS 1.2 (ECDHE-RSA-AES128-GCM-SHA256, troca ECDHE_RSA da RFC 8422, seção 2.2), recusa conexão só com TLS 1.3, certificado
  verificado até a Amazon Root CA 1 e CONNACK 0 para usuário e senha inventados. O certificado do
  broker vale até 31/01/2027; se a HiveMQ trocar de CA antes da aula, o `CA_RAIZ` do sketch precisa
  mudar. Repetir a medição na semana da aula.
- A execução do TLS dentro do Wokwi não foi conferida pelo acervo (sem acesso ao simulador por linha
  de comando). Testar o laboratório no Wokwi antes da aula. Se o handshake falhar no simulador, a
  dupla roda o mesmo sketch no ESP32 do kit.
- Lembrete da Prova do Módulo de amanhã, 11/12, peso 20. O quiz de revisão cobre lei de Ohm,
  constante de tempo, ADC e dBm, com números das aulas anteriores. O escopo da prova não está nas
  fontes do acervo (plano, planejamento, Adalove): confirmar com o professor responsável que esses
  temas caem e não usar questões da prova.
- O autoestudo do NIST aponta o SP 800-63B, revisão 3 (2017), substituído pela SP 800-63-4 a
  partir de 01/08/2025. Na revisão 3, biometria está na 5.2.3 (FMR de 1 em 1000); na SP 800-63B-4,
  na 3.2.3, com FMR de 1 em 10.000 para todos os grupos demográficos.

## Perguntas socráticas

### 1. Bloco 1: compilar o firmware esconde a senha?

"O sketch vira binário antes de ir para o ESP32. A senha continua lá dentro de forma legível?"

**Resposta esperada:** continua. Compilar traduz o código para instruções da máquina, e uma string
constante é copiada como está para o binário gravado na flash. Quem lê a flash do rastreador, que
passa meses numa oficina de terceiros, encontra a senha. A defesa é a criptografia da flash do
ESP32, com secure boot.

**Erro comum:** achar que mover a senha para `secrets.h` resolve tudo. A tabela do slide 5 mostra
onde a senha fica legível depois de cada defesa, e o `secrets.h` fecha só a linha do repositório.

### 2. Bloco 2: o que um atacante ganha sabendo onde estão os equipamentos?

"A posição de um equipamento parece um dado sem valor. O que alguém faz com ela?"

**Resposta esperada:** cruzada com NF, prazo e dias fora, a posição diz onde há um ativo de valor
parado, com qual fornecedor e há quanto tempo. É por isso que o TAPI trata localizações e rotas como
conteúdo restrito. Também diz algo sobre pessoas: a posição de um equipamento em transporte conta
por onde passou quem o levava, e o TAPI exclui rastrear pessoas.

**Erro comum:** responder só "roubo do equipamento". O impacto inclui exposição comercial do
fornecedor e da Cerradinho, e a pergunta abre o modelo de ameaça da ponderada.

### 3. Bloco 2: por que declarar o modelo de ameaça antes de ler o código?

"Que diferença faz escrever quem é o atacante antes de olhar o código?"

**Resposta esperada:** o modelo vira o filtro dos achados. Um atacante na mesma rede Wi-Fi alcança
o IP do ESP32; um atacante na internet, sem encaminhamento de porta, não alcança. A mesma
vulnerabilidade tem probabilidade diferente para cada um, e o barema exige que a análise seja
coerente com o modelo declarado.

**Erro comum:** escrever "um hacker" como atacante. O barema pede atacante, objetivo e acesso
nomeados de forma específica.

### 4. Bloco 3: este candidato da IA se aplica a este código?

"A IA listou injeção de SQL. Onde está o banco de dados deste servidor?"

**Resposta esperada:** o grupo aponta a característica do código que sustenta a decisão: se não há
consulta a banco, o candidato é descartado com essa justificativa. O descarte vale pelo que aponta
no código.

**Erro comum:** descartar sem apontar linha ou característica ("não se aplica porque é IoT"). Pelo
barema, descarte sem justificativa recebe zero no item.

### 5. Bloco 4: com TLS, o observador da rede vê o quê?

"Depois do handshake, o que sobra para quem observa a rede da oficina?"

**Resposta esperada:** o nome do broker no ClientHello (SNI), o IP e a porta, o tamanho e o
horário de cada mensagem. No TLS 1.2, também o certificado do broker. Usuário, senha e evento vão
cifrados.

**Erro comum:** dizer que o TLS esconde tudo, inclusive que o rastreador está se comunicando. O
tamanho e o horário bastam para saber quando o lacre gerou um evento fora da rotina semanal.

### 6. Bloco 4: por que o TLS 1.2 leva duas idas e voltas e o 1.3 uma?

"O que o TLS 1.3 mudou para economizar uma ida e volta?"

**Resposta esperada:** no TLS 1.3 o cliente já manda a sua parte da troca de chaves (`key_share`)
no ClientHello, e o servidor responde com a dele e com o certificado já protegido; o cliente pode
mandar dados depois do próprio Finished (RFC 8446, seção 2). No TLS 1.2 a troca de chaves ocupa uma
segunda ida e volta (RFC 5246, seção 7.3).

**Erro comum:** concluir que o rastreador usa TLS 1.3. O broker público recusou TLS 1.3 na medição,
e o núcleo esp32 3.3.12 traz o TLS 1.3 desligado no mbedTLS.

### 7. Bloco 5: usuário e senha no broker público protegem o rastreador?

"Configuramos usuário e senha. Quem ainda consegue publicar no nosso tópico?"

**Resposta esperada:** qualquer pessoa: o broker público aceitou usuário e senha inventados com
CONNACK 0. A configuração treina o código; a autenticação de fato depende de um broker que confira
a senha, o broker de sala (P7), com permissões por tópico como no desafio.

**Erro comum:** confundir o TLS com autenticação do cliente. O TLS com setCACert autentica o
broker para o rastreador. Quem autentica o rastreador é o usuário e senha, e só vale num broker que
os confira.

### 8. Bloco 5: o que acontece sem setCACert?

"Comente a linha do `setCACert`. Por que a conexão não sai?"

**Resposta esperada:** na biblioteca do núcleo 3.3.12, sem CA, sem pacote de CAs, sem chave
pré-compartilhada e sem `setInsecure`, o cliente seguro recusa antes da conexão TCP
(`ssl_client.cpp`, linhas 77 e 78, antes do `lwip_connect`), e o PubSubClient mostra `state` igual
a −2 (a confirmar no Wokwi). A biblioteca prefere falhar a conectar sem verificar o
servidor.

**Erro comum:** "resolver" com a opção que aceita qualquer certificado. A conexão sai, e qualquer
servidor que responda na porta passa a receber a senha e o evento.

### 9. Bloco 6: a ordem de risco está defendida pelo modelo?

"Por que o ataque de vocês está acima do ataque do outro grupo?"

**Resposta esperada:** a defesa compara probabilidade e impacto com base no modelo declarado. A
probabilidade cita o acesso do atacante do modelo, e o impacto cita a perda concreta para a
Cerradinho, como dado restrito exposto ou alerta de lacre desligado.

**Erro comum:** defender pela gravidade técnica ("esse é mais perigoso") sem citar o acesso do
atacante. A contestação mais comum do outro grupo é justamente "esse atacante não tem esse acesso".

## Fechamento

Recolher os relatórios da ponderada ao fim da instrução. Amarração: a ponderada (peso 2) e a Prova
do Módulo (peso 20, amanhã, 11/12) fecham as avaliações de Computação. A Sprint 5, etapa SP5 do
DAIA-E, termina na Apresentação Final de 18/12, e a decisão humana da etapa é quais riscos o grupo
aceita no protótipo final. A Aula 12, em 17/12, revisa o rastreador contra os entregáveis finais.

// ============================================================================
// MOTOR DE ROTAÇÃO EM BLOCOS (GRUPOS DE 10 TERAPEUTAS) E SCRIPTS DINÂMICOS
// ============================================================================

const RotacaoService = {
  BLOCOS: ["A", "B", "C", "D"],

  SCRIPTS_SEM_LINK_30: [
    "{{saudacao}}, {{primeiro_nome}}! Muita gente comenta por aí sobre palpitações, mãos frias e aquela sensação de alerta constante. Você já passou por algo assim e às vezes não sabe como lidar com isso? Sou especialista em saúde emocional e posso te ajudar — quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! É bem comum ver relatos sobre aperto no peito, mãos frias e mente acelerada no dia a dia. Você já sentiu esses sintomas e fica sem saber como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Alguma vez você já sentiu palpitações, frio nas mãos ou um nó no estômago sem motivo aparente? Quando não sabemos como lidar com isso, pesa bastante — sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muita gente relata na internet sentir falta de ar, mãos frias e cansaço emocional do nada. Você já teve algum desses sinais e não sabe bem como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Tem gente que convive com palpitações, mãos frias e tensão no corpo achando que é só fase. Você já percebeu esses sintomas e fica em dúvida de como lidar? Sou especialista em saúde emocional e posso te ajudar — quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! É frequente ouvirmos falar de mãos frias, coração disparado e inquietação. Você já sentiu algo parecido e não sabe como lidar com esses sintomas? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muitas pessoas comentam sobre tremores leves, mãos frias e preocupação constante. Você já passou por esses sintomas e não sabe como lidar com isso? Sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Já reparou como tanta gente fala em palpitações, mãos frias e sobrecarga interna? Você já sentiu alguma dessas reações e não sabe como lidar com elas? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Alguma vez você já sentiu mãos frias, palpitações ou aquele peso no peito? Quando bate a dúvida de como lidar com esses sintomas, faz diferença ter apoio — sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muita gente relata sentir suor frio, mãos frias e pensamentos soltos que não param. Você já teve esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! É comum ver pessoas mencionando palpitações, mãos frias e sensação de esgotamento. Você já sentiu isso alguma vez e não sabe como lidar com esses sintomas? Sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muita gente comenta sobre mãos frias, falta de fôlego leve e agitação. Você já passou por esses sintomas e fica sem saber como lidar? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muitas pessoas contam que sentem palpitações, mãos frias e aquele aperto por dentro. Você já teve esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar — quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Já notou quantos relatos existem sobre mãos frias, tensão nos ombros e coração acelerado? Você já sentiu algo assim e não sabe como lidar com esses sintomas? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Alguma vez você já sentiu palpitações, mãos frias e aquele desconforto que chega do nada? Se você não sabe como lidar com esses sintomas, eu posso te ajudar — sou especialista em saúde emocional. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muita gente fala em sentir mãos frias, palpitações e um cansaço que não passa com descanso. Você já sentiu esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! É bem comum ver relatos de inquietação, mãos frias e palpitações em momentos de tensão. Você já passou por isso e não sabe como lidar com esses sintomas? Sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muitas pessoas relatam sentir mãos frias, nó na garganta e batimentos acelerados. Você já teve esses sintomas e fica sem saber como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Já percebeu como é frequente falarem de palpitações, mãos frias e mente cansada? Você já sentiu alguma dessas coisas e não sabe como lidar com esses sintomas? Sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Alguma vez você já sentiu mãos frias, palpitações ou aquele frio na barriga fora de hora? Quando não sabe como lidar com esses sintomas, vale ter direção — sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muita gente comenta sobre sentir palpitações, mãos frias e um peso emocional difícil de explicar. Você já sentiu esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Tem gente que relata mãos frias, sensação de aperto e aceleração sem motivo claro. Você já passou por esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muitas pessoas falam em palpitações, mãos frias e dificuldade de relaxar de verdade. Você já teve esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Já ouviu falar de tantos relatos sobre mãos frias, palpitações e desgaste emocional? Você já sentiu esses sintomas e fica sem saber como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Alguma vez você já sentiu palpitações, mãos frias e aquele incômodo no peito? Se você não sabe como lidar com esses sintomas, sou especialista em saúde emocional e posso te ajudar — quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muita gente relata na internet sentir mãos frias, palpitações e um aperto na rotina. Você já sentiu esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! É comum ver pessoas falando de mãos frias, coração batendo forte e sobrecarga. Você já passou por esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Muitas pessoas comentam sobre palpitações, mãos frias e aquela sensação de estar no limite. Você já teve esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar. Quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Já notou como é comum ler relatos sobre mãos frias, palpitações e inquietação? Você já sentiu esses sintomas e não sabe como lidar com eles? Sou especialista em saúde emocional e posso te ajudar, quer saber como?",
    "{{saudacao}}, {{primeiro_nome}}! Alguma vez você já sentiu palpitações, mãos frias e aquele desconforto emocional no dia a dia? Se você não sabe como lidar com esses sintomas, eu posso te ajudar — sou especialista em saúde emocional. Quer saber como?"
  ],

  gerarHashNumerico(texto = "") {
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
      hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
    }
    return hash;
  },

  selecionarScriptVariado(lead = {}, indice = 0, templateCustomizado = "") {
    const lista = this.SCRIPTS_SEM_LINK_30;
    const chave = `${lead.id || ""}|${lead.username || ""}`;
    const baseIdx = chave.trim()
      ? (this.gerarHashNumerico(chave) + indice) % lista.length
      : indice % lista.length;

    const escolhido =
      templateCustomizado && templateCustomizado.includes("{{variacao_30}}")
        ? lista[baseIdx]
        : (templateCustomizado && !templateCustomizado.includes("Vi seu comentário") && !templateCustomizado.includes("Vi sua participação")
            ? templateCustomizado
            : lista[baseIdx]);

    return escolhido;
  },

  // Retorna a ordem prioritária de blocos para o grupo do terapeuta
  // Grupo 1 (1..10):  ['A', 'B', 'C', 'D']
  // Grupo 2 (11..20): ['B', 'C', 'D', 'A']
  // Grupo 3 (21..30): ['C', 'D', 'A', 'B']
  // Grupo 4 (31..40): ['D', 'A', 'B', 'C']
  obterOrdemBlocos(grupoRotacao = 1) {
    const indiceInicial = (Math.max(1, Number(grupoRotacao)) - 1) % this.BLOCOS.length;
    return [
      ...this.BLOCOS.slice(indiceInicial),
      ...this.BLOCOS.slice(0, indiceInicial)
    ];
  },

  // Retorna apenas o bloco prioritário principal daquele grupo
  obterBlocoPrincipal(grupoRotacao = 1) {
    return this.obterOrdemBlocos(grupoRotacao)[0];
  },

  // Ordena a lista de leads colocando primeiro o bloco prioritário do grupo,
  // e dentro de cada bloco ordena pelo maior engajamento
  ordenarLeadsPorGrupo(leads = [], grupoRotacao = 1, modoOrdenacao = "rotacao") {
    const ordemBlocos = this.obterOrdemBlocos(grupoRotacao);
    const pesoBloco = {};
    ordemBlocos.forEach((bloco, idx) => {
      pesoBloco[bloco] = idx;
    });

    return [...leads].sort((a, b) => {
      if (modoOrdenacao === "engajamento") {
        return (b.score_engajamento || 0) - (a.score_engajamento || 0);
      }

      if (modoOrdenacao === "recentes") {
        return new Date(b.criado_em) - new Date(a.criado_em);
      }

      // Padrão: Rotação justa por bloco do grupo + engajamento dentro do bloco
      const pA = pesoBloco[a.bloco_rotacao] ?? 99;
      const pB = pesoBloco[b.bloco_rotacao] ?? 99;
      if (pA !== pB) return pA - pB;

      return (b.score_engajamento || 0) - (a.score_engajamento || 0);
    });
  },

  // Calcula qual bloco (A, B, C ou D) atribuir ao importar novos leads em lote
  // para manter a distribuição percentual equilibrada (25% cada bloco)
  distribuirBlocosEmLote(listaItens = [], indiceOffset = 0) {
    return listaItens.map((item, idx) => {
      const bloco = this.BLOCOS[(indiceOffset + idx) % this.BLOCOS.length];
      return { ...item, bloco_rotacao: bloco };
    });
  },

  // Saudação automática baseada no horário local do navegador
  obterSaudacao() {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  },

  // Extrai um primeiro nome limpo (sem sobrenomes, emojis ou símbolos)
  extrairPrimeiroNome(nomeExibicao, username) {
    const base = (nomeExibicao || username || "").trim();
    const limpo = base
      .replace(/^@/, "")
      .replace(/[^\p{L}\s._-]/gu, "")
      .trim();

    if (!limpo) return "tudo bem";

    const primeiraPalavra = limpo.split(/[\s._-]+/)[0];
    if (!primeiraPalavra || primeiraPalavra.length < 2) return "tudo bem";

    return (
      primeiraPalavra.charAt(0).toUpperCase() +
      primeiraPalavra.slice(1).toLowerCase()
    );
  },

  // Preenche variáveis do script garantindo que não haja links na 1ª mensagem
  renderizarScript(templateMensagem, lead, nomeSubcategoria = "", indiceVariacao = 0) {
    templateMensagem = this.selecionarScriptVariado(lead, indiceVariacao, templateMensagem);
    const primeiroNome = this.extrairPrimeiroNome(lead.nome_exibicao, lead.username);
    const saudacao = this.obterSaudacao();
    const tema = nomeSubcategoria || "esse tema";

    return templateMensagem
      .replace(/\{\{\s*saudacao\s*\}\}/gi, saudacao)
      .replace(/\{\{\s*primeiro_nome\s*\}\}/gi, primeiroNome)
      .replace(/\{\{\s*nome\s*\}\}/gi, primeiroNome)
      .replace(/\{\{\s*subcategoria\s*\}\}/gi, tema.toLowerCase())
      .replace(/\{\{\s*tema\s*\}\}/gi, tema.toLowerCase());
  }
};
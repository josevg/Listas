// ============================================================================
// MOTOR DE ROTAÇÃO EM BLOCOS (GRUPOS DE 10 TERAPEUTAS) E SCRIPTS DINÂMICOS
// ============================================================================

const RotacaoService = {
  BLOCOS: ["A", "B", "C", "D"],

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
  renderizarScript(templateMensagem, lead, nomeSubcategoria = "") {
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
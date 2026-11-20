// ============================================================================
// ARMAZENAMENTO 100% LOCAL NO NAVEGADOR (CONTATADOS, ENGAJADOS, NOTAS E BACKUP)
// ============================================================================

const LocalDB = {
  prefixo(userId) {
    return `terapeuta_leads_${userId || "anon"}`;
  },

  obterChaveHoje() {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  },

  carregarDados(userId) {
    try {
      const bruto = localStorage.getItem(this.prefixo(userId));
      if (!bruto) {
        return {
          contatados: {},   // { [leadId]: { username, nome, subcategoria, data, nota } }
          engajados: {},    // { [leadId]: { username, nome, subcategoria, status, data, nota } }
          descartados: {},  // { [leadId]: true }
          diario: {}        // { "2026-11-20": { copiados: 0, abertos: 0 } }
        };
      }
      const parsed = JSON.parse(bruto);
      return {
        contatados: parsed.contatados || {},
        engajados: parsed.engajados || {},
        descartados: parsed.descartados || {},
        diario: parsed.diario || {}
      };
    } catch (e) {
      console.error("Erro ao ler localStorage:", e);
      return { contatados: {}, engajados: {}, descartados: {}, diario: {} };
    }
  },

  salvarDados(userId, dados) {
    try {
      localStorage.setItem(this.prefixo(userId), JSON.stringify(dados));
    } catch (e) {
      alert("Limite de armazenamento local do navegador atingido. Exporte um backup antes de limpar itens antigos.");
    }
  },

  // Registra ação de copiar script ou abrir perfil e atualiza o contador diário
  registrarContato(userId, lead, tipoAcao = "copiou", nomeSubcategoria = "") {
    const dados = this.carregarDados(userId);
    const hoje = this.obterChaveHoje();

    if (!dados.diario[hoje]) {
      dados.diario[hoje] = { copiados: 0, abertos: 0 };
    }

    if (tipoAcao === "copiou") {
      dados.diario[hoje].copiados += 1;
    } else if (tipoAcao === "abriu") {
      dados.diario[hoje].abertos += 1;
    }

    const existente = dados.contatados[lead.id] || {};
    dados.contatados[lead.id] = {
      id: lead.id,
      username: lead.username,
      nome: lead.nome_exibicao || lead.username,
      subcategoria: nomeSubcategoria || existente.subcategoria || "",
      data: new Date().toISOString(),
      nota: existente.nota || ""
    };

    this.salvarDados(userId, dados);
    return dados;
  },

  // Alterna marcação manual de contatado
  alternarContatado(userId, lead, nomeSubcategoria = "") {
    const dados = this.carregarDados(userId);
    if (dados.contatados[lead.id]) {
      delete dados.contatados[lead.id];
    } else {
      dados.contatados[lead.id] = {
        id: lead.id,
        username: lead.username,
        nome: lead.nome_exibicao || lead.username,
        subcategoria: nomeSubcategoria,
        data: new Date().toISOString(),
        nota: ""
      };
    }
    this.salvarDados(userId, dados);
    return dados;
  },

  // Adiciona ou atualiza pessoa na lista local de Engajados / Interessados
  salvarEngajado(userId, lead, status = "respondeu", nomeSubcategoria = "", nota = "") {
    const dados = this.carregarDados(userId);
    const atual = dados.engajados[lead.id] || {};

    dados.engajados[lead.id] = {
      id: lead.id,
      username: lead.username,
      nome: lead.nome_exibicao || lead.username,
      subcategoria: nomeSubcategoria || atual.subcategoria || "",
      status, // 'respondeu' | 'interessado' | 'agendado'
      nota: nota !== undefined ? nota : (atual.nota || ""),
      data: new Date().toISOString()
    };

    // Garante que também conste como contatado
    if (!dados.contatados[lead.id]) {
      dados.contatados[lead.id] = {
        id: lead.id,
        username: lead.username,
        nome: lead.nome_exibicao || lead.username,
        subcategoria: nomeSubcategoria || "",
        data: new Date().toISOString(),
        nota: nota || ""
      };
    }

    this.salvarDados(userId, dados);
    return dados;
  },

  removerEngajado(userId, leadId) {
    const dados = this.carregarDados(userId);
    delete dados.engajados[leadId];
    this.salvarDados(userId, dados);
    return dados;
  },

  salvarNota(userId, lead, nota, nomeSubcategoria = "") {
    const dados = this.carregarDados(userId);
    if (dados.contatados[lead.id]) {
      dados.contatados[lead.id].nota = nota;
    } else {
      dados.contatados[lead.id] = {
        id: lead.id,
        username: lead.username,
        nome: lead.nome_exibicao || lead.username,
        subcategoria: nomeSubcategoria,
        data: new Date().toISOString(),
        nota
      };
    }
    if (dados.engajados[lead.id]) {
      dados.engajados[lead.id].nota = nota;
    }
    this.salvarDados(userId, dados);
    return dados;
  },

  marcarDescartado(userId, leadId) {
    const dados = this.carregarDados(userId);
    dados.descartados[leadId] = true;
    this.salvarDados(userId, dados);
    return dados;
  },

  obterResumoHoje(userId) {
    const dados = this.carregarDados(userId);
    const hoje = this.obterChaveHoje();
    const reg = dados.diario[hoje] || { copiados: 0, abertos: 0 };
    return {
      copiadosHoje: reg.copiados,
      abertosHoje: reg.abertos,
      totalContatados: Object.keys(dados.contatados).length,
      totalEngajados: Object.keys(dados.engajados).length
    };
  },

  // Exporta arquivo JSON para o terapeuta não perder suas listas se trocar de aparelho
  exportarBackupJSON(userId) {
    const dados = this.carregarDados(userId);
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-leads-terapeuta-${this.obterChaveHoje()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importarBackupJSON(userId, arquivo) {
    const texto = await arquivo.text();
    const importado = JSON.parse(texto);
    if (!importado || typeof importado !== "object") {
      throw new Error("Arquivo de backup inválido.");
    }
    const atual = this.carregarDados(userId);
    const mesclado = {
      contatados: { ...atual.contatados, ...(importado.contatados || {}) },
      engajados: { ...atual.engajados, ...(importado.engajados || {}) },
      descartados: { ...atual.descartados, ...(importado.descartados || {}) },
      diario: { ...atual.diario, ...(importado.diario || {}) }
    };
    this.salvarDados(userId, mesclado);
    return mesclado;
  }
};
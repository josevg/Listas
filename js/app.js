// ============================================================================
// CONTROLADOR DO PAINEL DO TERAPEUTA (app.html)
// ============================================================================

const AppState = {
  perfil: null,
  categoriasPrincipais: [],
  subcategorias: [],
  scripts: [],
  leadsCarregados: [],
  limiteExibicao: 30,
  abaAtual: "explorar"
};

document.addEventListener("DOMContentLoaded", async () => {
  const auth = await AuthService.protegerRota({ exigirAdmin: false });
  if (!auth) return;

  AppState.perfil = auth.perfil;

  document.getElementById("infoUsuarioTop").textContent = auth.perfil.nome;
  document.getElementById("btnSair").addEventListener("click", () => AuthService.logout());
  document.getElementById("btnSairBloqueio").addEventListener("click", () => AuthService.logout());

  if (auth.perfil.role === "admin") {
    document.getElementById("linkAdmin").classList.remove("hidden");
  }

  // Se o acesso não estiver ativo ou estiver fora da janela de datas
  if (!auth.statusAcesso.valido) {
    document.getElementById("telaBloqueio").classList.remove("hidden");
    document.getElementById("msgBloqueio").textContent = auth.statusAcesso.mensagem;
    return;
  }

  document.getElementById("conteudoApp").classList.remove("hidden");
  configurarEventosUI();
  await inicializarDadosPainel();
});

function configurarEventosUI() {
  // Recolher/expandir guia de segurança do topo
  const btnToggleGuia = document.getElementById("btnToggleGuia");
  const corpoGuia = document.getElementById("corpoGuiaSeguranca");
  btnToggleGuia.addEventListener("click", () => {
    const oculto = corpoGuia.classList.toggle("hidden");
    btnToggleGuia.textContent = oculto ? "Ver orientações" : "Ocultar detalhes";
  });

  // Navegação por abas
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      AppState.abaAtual = btn.dataset.aba;

      document.getElementById("abaExplorar").classList.toggle("hidden", AppState.abaAtual !== "explorar");
      document.getElementById("abaContatados").classList.toggle("hidden", AppState.abaAtual !== "contatados");
      document.getElementById("abaEngajados").classList.toggle("hidden", AppState.abaAtual !== "engajados");
      document.getElementById("abaBackup").classList.toggle("hidden", AppState.abaAtual !== "backup");

      if (AppState.abaAtual === "contatados") renderizarAbaContatados();
      if (AppState.abaAtual === "engajados") renderizarAbaEngajados();
    });
  });

  // Filtros
  document.getElementById("filtroCategoriaPrincipal").addEventListener("change", () => {
    preencherSelectSubcategorias();
    atualizarSelectScripts();
    AppState.limiteExibicao = 30;
    carregarLeadsFiltrados();
  });

  document.getElementById("filtroSubcategoria").addEventListener("change", () => {
    atualizarSelectScripts();
    AppState.limiteExibicao = 30;
    carregarLeadsFiltrados();
  });

  document.getElementById("filtroOrdenacao").addEventListener("change", () => renderizarListaLeads());
  document.getElementById("filtroStatusLocal").addEventListener("change", () => renderizarListaLeads());
  document.getElementById("selectScriptModelo").addEventListener("change", () => renderizarListaLeads());
  document.getElementById("buscaPerfil").addEventListener("input", () => renderizarListaLeads());

  document.getElementById("btnCarregarMais").addEventListener("click", () => {
    AppState.limiteExibicao += 30;
    renderizarListaLeads();
  });

  document.getElementById("filtroEstagioEngajado").addEventListener("change", () => renderizarAbaEngajados());

  // Backup Local
  document.getElementById("btnExportarBackup").addEventListener("click", () => {
    LocalDB.exportarBackupJSON(AppState.perfil.id);
  });

  document.getElementById("inputImportarBackup").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await LocalDB.importarBackupJSON(AppState.perfil.id, file);
      atualizarResumoSuperior();
      renderizarListaLeads();
      alert("Backup restaurado com sucesso!");
    } catch (err) {
      alert(err.message || "Erro ao importar backup.");
    }
    e.target.value = "";
  });
}

async function inicializarDadosPainel() {
  atualizarResumoSuperior();

  const [resCat, resSub, resScripts] = await Promise.all([
    supabaseClient.from("categorias_principais").select("*").eq("ativa", true).order("ordem"),
    supabaseClient.from("subcategorias").select("*").eq("ativa", true).order("ordem"),
    supabaseClient.from("scripts").select("*").eq("ativo", true).order("criado_em", { ascending: false })
  ]);

  AppState.categoriasPrincipais = resCat.data || [];
  AppState.subcategorias = resSub.data || [];
  AppState.scripts = resScripts.data || [];

  const selCat = document.getElementById("filtroCategoriaPrincipal");
  selCat.innerHTML = AppState.categoriasPrincipais
    .map((c) => `<option value="${c.id}">${c.nome}</option>`)
    .join("");

  preencherSelectSubcategorias();
  atualizarSelectScripts();
  await carregarLeadsFiltrados();
}

function preencherSelectSubcategorias() {
  const catId = document.getElementById("filtroCategoriaPrincipal").value;
  const subs = AppState.subcategorias.filter((s) => s.categoria_principal_id === catId);

  const selSub = document.getElementById("filtroSubcategoria");
  selSub.innerHTML =
    `<option value="todas">Todas as subcategorias</option>` +
    subs.map((s) => `<option value="${s.id}">${s.nome}</option>`).join("");
}

function atualizarSelectScripts() {
  const catId = document.getElementById("filtroCategoriaPrincipal").value;
  const subId = document.getElementById("filtroSubcategoria").value;

  const disponiveis = AppState.scripts.filter((sc) => {
    if (subId !== "todas" && sc.subcategoria_id === subId) return true;
    if (!sc.subcategoria_id && (!sc.categoria_principal_id || sc.categoria_principal_id === catId)) return true;
    return false;
  });

  const listaFinal = disponiveis.length ? disponiveis : AppState.scripts;
  const selScript = document.getElementById("selectScriptModelo");

  if (!listaFinal.length) {
    selScript.innerHTML = `<option value="">Script padrão de acolhimento</option>`;
    return;
  }

  selScript.innerHTML = listaFinal
    .map((sc) => `<option value="${sc.id}">${sc.titulo}</option>`)
    .join("");
}

async function carregarLeadsFiltrados() {
  const container = document.getElementById("listaLeadsContainer");
  container.innerHTML = `<div class="empty-state">Carregando perfis...</div>`;

  const catId = document.getElementById("filtroCategoriaPrincipal").value;
  const subId = document.getElementById("filtroSubcategoria").value;

  let query = supabaseClient
    .from("perfis_leads")
    .select("*")
    .eq("ativo", true)
    .eq("reportado_invalido", false)
    .limit(600);

  if (catId) query = query.eq("categoria_principal_id", catId);
  if (subId && subId !== "todas") query = query.eq("subcategoria_id", subId);

  const { data, error } = await query;
  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Erro ao carregar perfis: ${error.message}</div>`;
    return;
  }

  AppState.leadsCarregados = data || [];
  renderizarListaLeads();
}

function obterNomeSubcategoria(subId) {
  const sub = AppState.subcategorias.find((s) => s.id === subId);
  return sub ? sub.nome : "Tema Emocional";
}

function obterTemplateScriptSelecionado() {
  const scriptId = document.getElementById("selectScriptModelo").value;
  const encontrado = AppState.scripts.find((s) => s.id === scriptId);
  return (
    encontrado?.mensagem ||
    "{{saudacao}}, {{primeiro_nome}}! Tudo bem? Vi um comentário seu sobre {{subcategoria}} e senti vontade de te perguntar: como você tem lidado com isso no seu dia a dia?"
  );
}

function renderizarListaLeads() {
  const container = document.getElementById("listaLeadsContainer");
  const dadosLocais = LocalDB.carregarDados(AppState.perfil.id);
  const modoOrdenacao = document.getElementById("filtroOrdenacao").value;
  const filtroStatus = document.getElementById("filtroStatusLocal").value;
  const termoBusca = document.getElementById("buscaPerfil").value.trim().toLowerCase();

  let lista = AppState.leadsCarregados.filter((lead) => !dadosLocais.descartados[lead.id]);

  if (filtroStatus === "nao_contatados") {
    lista = lista.filter((lead) => !dadosLocais.contatados[lead.id]);
  }

  if (termoBusca) {
    lista = lista.filter(
      (lead) =>
        (lead.username || "").toLowerCase().includes(termoBusca) ||
        (lead.nome_exibicao || "").toLowerCase().includes(termoBusca) ||
        (lead.contexto_comentario || "").toLowerCase().includes(termoBusca)
    );
  }

  lista = RotacaoService.ordenarLeadsPorGrupo(lista, AppState.perfil.grupo_rotacao, modoOrdenacao);

  const totalFiltrado = lista.length;
  const visiveis = lista.slice(0, AppState.limiteExibicao);

  const btnMais = document.getElementById("btnCarregarMais");
  btnMais.classList.toggle("hidden", totalFiltrado <= AppState.limiteExibicao);

  if (!visiveis.length) {
    container.innerHTML = `<div class="empty-state card" style="grid-column: 1 / -1;">Nenhum perfil encontrado para os filtros selecionados.</div>`;
    return;
  }

  const template = obterTemplateScriptSelecionado();

  container.innerHTML = visiveis
    .map((lead) => {
      const nomeSub = obterNomeSubcategoria(lead.subcategoria_id);
      const scriptPronto = RotacaoService.renderizarScript(template, lead, nomeSub);
      const jaContatado = Boolean(dadosLocais.contatados[lead.id]);
      const jaEngajado = dadosLocais.engajados[lead.id];
      const urlIg = `https://www.instagram.com/${lead.username.replace(/^@/, "")}/`;

      return `
        <article class="lead-card ${jaContatado ? "is-contacted" : ""}" data-lead-id="${lead.id}">
          <div>
            <div class="lead-header">
              <div>
                <div class="lead-handle">@${lead.username.replace(/^@/, "")}</div>
                <div class="lead-sub">${lead.nome_exibicao || "Perfil do Instagram"}</div>
              </div>
              
            </div>

            <div class="lead-meta">
              <span class="badge badge-neutral">${nomeSub}</span>
              <span class="badge badge-neutral">Engajamento: ${lead.score_engajamento}</span>
              ${jaContatado ? `<span class="badge badge-success">Contatado</span>` : ""}
              ${jaEngajado ? `<span class="badge badge-warning">Engajado (${jaEngajado.status})</span>` : ""}
            </div>

            ${
              lead.contexto_comentario
                ? `<div class="lead-context" style="margin-top: 10px;"><strong>Contexto:</strong> ${lead.contexto_comentario}</div>`
                : ""
            }

            <div class="script-box" style="margin-top: 10px;">${scriptPronto}</div>
          </div>

          <div>
            <div class="lead-actions">
              <button type="button" class="btn btn-primary btn-sm" onclick="acaoCopiarScript('${lead.id}')">
                1. Copiar Script
              </button>
              <a href="${urlIg}" target="_blank" rel="noopener noreferrer" class="btn btn-accent btn-sm" onclick="acaoAbriuPerfil('${lead.id}')">
                2. Abrir Instagram
              </a>
              <button type="button" class="btn btn-outline btn-sm" onclick="acaoMarcarEngajado('${lead.id}')">
                + Engajado
              </button>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
              <button type="button" class="btn btn-ghost btn-sm" onclick="acaoAlternarContatado('${lead.id}')">
                ${jaContatado ? "Desmarcar contato" : "Marcar contatado"}
              </button>
              <button type="button" class="btn btn-ghost btn-sm" onclick="acaoReportarInvalido('${lead.id}')">
                Perfil inválido
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function encontrarLead(leadId) {
  return AppState.leadsCarregados.find((l) => l.id === leadId);
}

async function registrarMetricaSilenciosa({ copiados = 0, abertos = 0, engajados = 0, categoria = null }) {
  try {
    await supabaseClient.rpc("registrar_metrica_diaria", {
      p_copiados: copiados,
      p_abertos: abertos,
      p_engajados: engajados,
      p_categoria: categoria
    });
  } catch (e) {
    // Não bloqueia a experiência local caso ocorra falha momentânea de rede
  }
}

async function acaoCopiarScript(leadId) {
  const lead = encontrarLead(leadId);
  if (!lead) return;

  const nomeSub = obterNomeSubcategoria(lead.subcategoria_id);
  const texto = RotacaoService.renderizarScript(obterTemplateScriptSelecionado(), lead, nomeSub);

  await navigator.clipboard.writeText(texto);
  LocalDB.registrarContato(AppState.perfil.id, lead, "copiou", nomeSub);

  atualizarResumoSuperior();
  renderizarListaLeads();
  registrarMetricaSilenciosa({ copiados: 1, categoria: nomeSub });
}

function acaoAbriuPerfil(leadId) {
  const lead = encontrarLead(leadId);
  if (!lead) return;

  const nomeSub = obterNomeSubcategoria(lead.subcategoria_id);
  LocalDB.registrarContato(AppState.perfil.id, lead, "abriu", nomeSub);

  atualizarResumoSuperior();
  setTimeout(() => renderizarListaLeads(), 200);
  registrarMetricaSilenciosa({ abertos: 1, categoria: nomeSub });
}

function acaoAlternarContatado(leadId) {
  const lead = encontrarLead(leadId);
  if (!lead) return;
  const nomeSub = obterNomeSubcategoria(lead.subcategoria_id);
  LocalDB.alternarContatado(AppState.perfil.id, lead, nomeSub);
  atualizarResumoSuperior();
  renderizarListaLeads();
}

function acaoMarcarEngajado(leadId) {
  const lead = encontrarLead(leadId);
  if (!lead) return;
  const nomeSub = obterNomeSubcategoria(lead.subcategoria_id);
  const nota = prompt("Anotação rápida sobre essa pessoa (opcional):", "") ?? "";

  const dados = LocalDB.salvarEngajado(AppState.perfil.id, lead, "respondeu", nomeSub, nota);
  atualizarResumoSuperior();
  renderizarListaLeads();
  registrarMetricaSilenciosa({
    engajados: Object.keys(dados.engajados).length,
    categoria: nomeSub
  });
}

async function acaoReportarInvalido(leadId) {
  if (!confirm("Deseja ocultar este perfil localmente e sinalizar como inválido/privado?")) return;
  LocalDB.marcarDescartado(AppState.perfil.id, leadId);
  renderizarListaLeads();
  try {
    await supabaseClient.rpc("reportar_perfil_lead", { p_lead_id: leadId });
  } catch (e) {}
}

function renderizarAbaContatados() {
  const container = document.getElementById("listaContatadosContainer");
  const dados = LocalDB.carregarDados(AppState.perfil.id);
  const itens = Object.values(dados.contatados).sort((a, b) => new Date(b.data) - new Date(a.data));

  if (!itens.length) {
    container.innerHTML = `<div class="empty-state">Nenhum perfil marcado como contatado ainda.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Perfil</th>
            <th>Subcategoria</th>
            <th>Data do Contato</th>
            <th>Anotação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${itens
            .map(
              (item) => `
            <tr>
              <td><strong>@${item.username.replace(/^@/, "")}</strong><br><small>${item.nome || ""}</small></td>
              <td>${item.subcategoria || "-"}</td>
              <td>${new Date(item.data).toLocaleDateString("pt-BR")}</td>
              <td>${item.nota || "-"}</td>
              <td>
                <a href="https://www.instagram.com/${item.username.replace(/^@/, "")}/" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Abrir IG</a>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarAbaEngajados() {
  const container = document.getElementById("listaEngajadosContainer");
  const filtro = document.getElementById("filtroEstagioEngajado").value;
  const dados = LocalDB.carregarDados(AppState.perfil.id);

  const pesoEstagio = { agendado: 1, interessado: 2, respondeu: 3 };
  let itens = Object.values(dados.engajados);

  if (filtro !== "todos") {
    itens = itens.filter((i) => i.status === filtro);
  }

  itens.sort((a, b) => (pesoEstagio[a.status] || 9) - (pesoEstagio[b.status] || 9));

  if (!itens.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma pessoa salva na lista de engajados ainda.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Perfil</th>
            <th>Tema</th>
            <th>Estágio</th>
            <th>Anotação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${itens
            .map(
              (item) => `
            <tr>
              <td><strong>@${item.username.replace(/^@/, "")}</strong><br><small>${item.nome || ""}</small></td>
              <td>${item.subcategoria || "-"}</td>
              <td>
                <select class="select" style="padding: 5px 8px;" onchange="alterarEstagioEngajado('${item.id}', this.value)">
                  <option value="respondeu" ${item.status === "respondeu" ? "selected" : ""}>Respondeu</option>
                  <option value="interessado" ${item.status === "interessado" ? "selected" : ""}>Interessado</option>
                  <option value="agendado" ${item.status === "agendado" ? "selected" : ""}>Agendou</option>
                </select>
              </td>
              <td>${item.nota || "-"}</td>
              <td style="display: flex; gap: 6px;">
                <a href="https://www.instagram.com/${item.username.replace(/^@/, "")}/" target="_blank" rel="noopener noreferrer" class="btn btn-accent btn-sm">Abrir IG</a>
                <button type="button" class="btn btn-ghost btn-sm" onclick="removerDaListaEngajados('${item.id}')">Remover</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function alterarEstagioEngajado(leadId, novoStatus) {
  const dados = LocalDB.carregarDados(AppState.perfil.id);
  if (!dados.engajados[leadId]) return;
  dados.engajados[leadId].status = novoStatus;
  LocalDB.salvarDados(AppState.perfil.id, dados);
  renderizarAbaEngajados();
}

function removerDaListaEngajados(leadId) {
  LocalDB.removerEngajado(AppState.perfil.id, leadId);
  atualizarResumoSuperior();
  renderizarAbaEngajados();
}

function atualizarResumoSuperior() {
  const resumo = LocalDB.obterResumoHoje(AppState.perfil.id);
  const meta = AppState.perfil.meta_diaria || 15;

  document.getElementById("statTotalContatados").textContent = resumo.totalContatados;
  document.getElementById("statTotalEngajados").textContent = resumo.totalEngajados;

  if (AppState.perfil.data_expiracao) {
    document.getElementById("statValidade").textContent = `Até ${new Date(AppState.perfil.data_expiracao).toLocaleDateString("pt-BR")}`;
  } else {
    document.getElementById("statValidade").textContent = "Sem vencimento";
  }

  // Termômetro diário
  const totalHoje = Math.max(resumo.copiadosHoje, resumo.abertosHoje);
  const pct = Math.min(100, Math.round((totalHoje / meta) * 100));
  const barra = document.getElementById("barraCadenciaHoje");
  const badge = document.getElementById("statusCadenciaBadge");

  document.getElementById("textoCadenciaHoje").textContent = `${totalHoje} / ${meta} abordagens recomendadas hoje`;
  barra.style.width = `${pct}%`;

  if (totalHoje > meta) {
    barra.style.backgroundColor = "var(--danger)";
    badge.className = "badge badge-danger";
    badge.textContent = "Limite diário atingido — faça pausa até amanhã";
  } else if (totalHoje >= Math.ceil(meta * 0.75)) {
    barra.style.backgroundColor = "var(--warning)";
    badge.className = "badge badge-warning";
    badge.textContent = "Próximo do limite diário";
  } else {
    barra.style.backgroundColor = "var(--success)";
    badge.className = "badge badge-success";
    badge.textContent = "Ritmo seguro";
  }
}

// Modo de inspeção do Admin (?terapeuta_id=UUID) para visualizar o grupo/bloco de um terapeuta
(async function initInspecaoAdmin() {
  const params = new URLSearchParams(window.location.search);
  const alvoId = params.get("terapeuta_id");
  if (!alvoId) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;
  const eu = await AuthService.obterPerfilUsuario(session.user.id);
  if (!eu || eu.role !== "admin") return;

  const alvo = await AuthService.obterPerfilUsuario(alvoId);
  if (!alvo) return;

  const bloco = typeof RotacaoService !== "undefined"
    ? RotacaoService.obterBlocoPrincipal(alvo.grupo_rotacao || 1)
    : "A";

  const banner = document.createElement("div");
  banner.className = "alert alert-warning";
  banner.style.marginTop = "14px";
  banner.innerHTML = `<strong>Visão Admin do Terapeuta:</strong> ${alvo.nome} (${alvo.email}) — <strong>Grupo ${alvo.grupo_rotacao || 1} • Bloco ${bloco}</strong>`;
  const main = document.querySelector("main.container");
  if (main) main.prepend(banner);
})();

// ============================================================================
// CONTROLADOR DO PAINEL ADMINISTRATIVO (admin.html)
// ============================================================================

const AdminState = {
  adminUser: null,
  usuarios: [],
  categoriasPrincipais: [],
  subcategorias: [],
  scripts: [],
  metricas: [],
  totalPerfisAtivos: 0
};

document.addEventListener("DOMContentLoaded", async () => {
  const auth = await AuthService.protegerRota({ exigirAdmin: true });
  if (!auth) return;

  if (!auth.statusAcesso.valido) {
    alert("Sua conta de admin está inativa.");
    await AuthService.logout();
    return;
  }

  AdminState.adminUser = auth.perfil;
  document.getElementById("infoAdminTop").textContent = `Admin: ${auth.perfil.nome}`;
  document.getElementById("btnSairAdmin").addEventListener("click", () => AuthService.logout());

  configurarAbasAdmin();
  configurarFormulariosAdmin();
  await carregarTudoAdmin();
});

function mostrarAlertaAdmin(tipo, msg) {
  const el = document.getElementById("alertaAdmin");
  el.className = `alert alert-${tipo}`;
  el.textContent = msg;
  el.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function criarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toInputDateTimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

function configurarAbasAdmin() {
  document.querySelectorAll("[data-admtab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const alvo = btn.dataset.admtab;
      document.querySelectorAll("[data-admtab]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.getElementById("admAbaTerapeutas").classList.toggle("hidden", alvo !== "terapeutas");
      document.getElementById("admAbaCategorias").classList.toggle("hidden", alvo !== "categorias");
      document.getElementById("admAbaPerfis").classList.toggle("hidden", alvo !== "perfis");
      document.getElementById("admAbaScripts").classList.toggle("hidden", alvo !== "scripts");
      document.getElementById("admAbaRelatorios").classList.toggle("hidden", alvo !== "relatorios");
    });
  });
}

async function carregarTudoAdmin() {
  const [resUsers, resCat, resSub, resScripts, resMetricas, resPerfisCount] = await Promise.all([
    supabaseClient.from("usuarios").select("*").order("criado_em", { ascending: false }),
    supabaseClient.from("categorias_principais").select("*").order("ordem"),
    supabaseClient.from("subcategorias").select("*").order("ordem"),
    supabaseClient.from("scripts").select("*").order("criado_em", { ascending: false }),
    supabaseClient.from("metricas_uso").select("*").order("ultimo_acesso", { ascending: false }),
    supabaseClient.from("perfis_leads").select("id", { count: "exact", head: true }).eq("ativo", true).eq("reportado_invalido", false)
  ]);

  AdminState.usuarios = resUsers.data || [];
  AdminState.categoriasPrincipais = resCat.data || [];
  AdminState.subcategorias = resSub.data || [];
  AdminState.scripts = resScripts.data || [];
  AdminState.metricas = resMetricas.data || [];
  AdminState.totalPerfisAtivos = resPerfisCount.count || 0;

  atualizarCardsTopoAdmin();
  popularSelectsCategoriasAdmin();
  renderizarTabelaTerapeutas();
  renderizarListaCategoriasAdmin();
  renderizarListaScriptsAdmin();
  renderizarRelatoriosTerapeutas();
}

function atualizarCardsTopoAdmin() {
  const terapeutas = AdminState.usuarios.filter((u) => u.role === "terapeuta");
  const ativosAgora = terapeutas.filter((u) => AuthService.verificarValidadeAcesso(u).valido).length;
  const totalCopiados = AdminState.metricas.reduce((acc, m) => acc + (m.scripts_copiados || 0), 0);

  document.getElementById("admTotalUsuarios").textContent = terapeutas.length;
  document.getElementById("admAtivosHoje").textContent = ativosAgora;
  document.getElementById("admTotalPerfis").textContent = AdminState.totalPerfisAtivos;
  document.getElementById("admTotalCopiados").textContent = totalCopiados;
}

function popularSelectsCategoriasAdmin() {
  const cats = AdminState.categoriasPrincipais;
  const optionsCats = cats.map((c) => `<option value="${c.id}">${c.nome}</option>`).join("");

  document.getElementById("subCatPrincipalSelect").innerHTML = optionsCats;
  document.getElementById("importCatPrincipal").innerHTML = optionsCats;
  document.getElementById("scriptCatPrincipal").innerHTML = `<option value="">Todas as categorias principais</option>${optionsCats}`;

  sincronizarSubcategoriasSelect("importCatPrincipal", "importSubcategoria", false);
  sincronizarSubcategoriasSelect("scriptCatPrincipal", "scriptSubcategoria", true);
}

function sincronizarSubcategoriasSelect(selectCatId, selectSubId, incluirOpcaoVazia) {
  const catId = document.getElementById(selectCatId).value;
  const subs = AdminState.subcategorias.filter((s) => !catId || s.categoria_principal_id === catId);
  const elSub = document.getElementById(selectSubId);

  const prefixo = incluirOpcaoVazia ? `<option value="">Geral da categoria (sem subcategoria fixa)</option>` : "";
  elSub.innerHTML = prefixo + subs.map((s) => `<option value="${s.id}">${s.nome}</option>`).join("");
}

function renderizarTabelaTerapeutas() {
  const container = document.getElementById("tabelaTerapeutasContainer");
  const terapeutas = AdminState.usuarios.filter((u) => u.role === "terapeuta");

  if (!terapeutas.length) {
    container.innerHTML = `<div class="empty-state">Nenhum terapeuta cadastrado ainda.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Terapeuta</th>
            <th>WhatsApp</th>
            <th>Status Atual</th>
            <th>Ativo</th>
            <th>Início Acesso</th>
            <th>Expiração</th>
            <th>Grupo (10/grupo)</th>
            <th>Meta/Dia</th>
            <th>Salvar</th>
          </tr>
        </thead>
        <tbody>
          ${terapeutas
            .map((u) => {
              const validade = AuthService.verificarValidadeAcesso(u);
              const badgeClass = validade.valido ? "badge-success" : "badge-warning";
              const badgeTexto = validade.valido ? "Ativo" : validade.mensagem;
              const whatsLimpo = (u.whatsapp || "").replace(/\D/g, "");
              const linkWhats = whatsLimpo ? `https://wa.me/55${whatsLimpo.replace(/^55/, "")}` : "";

              return `
                <tr data-user-id="${u.id}">
                  <td><strong>${u.nome}</strong><br><small>${u.email}</small></td>
                  <td>
                    ${
                      linkWhats
                        ? `<a href="${linkWhats}" target="_blank" rel="noopener noreferrer">${u.whatsapp}</a>`
                        : "-"
                    }
                  </td>
                  <td><span class="badge ${badgeClass}">${badgeTexto}</span></td>
                  <td>
                    <input type="checkbox" class="usr-ativo" ${u.ativo ? "checked" : ""} />
                  </td>
                  <td>
                    <input type="datetime-local" class="input usr-inicio" style="padding: 6px; font-size: 0.82rem;" value="${toInputDateTimeLocal(u.data_inicio)}" />
                  </td>
                  <td>
                    <input type="datetime-local" class="input usr-expiracao" style="padding: 6px; font-size: 0.82rem;" value="${toInputDateTimeLocal(u.data_expiracao)}" />
                  </td>
                  <td>
                    <input type="number" min="1" class="input usr-grupo" style="width: 72px; padding: 6px;" value="${u.grupo_rotacao || 1}" />
                  </td>
                  <td>
                    <input type="number" min="1" max="100" class="input usr-meta" style="width: 72px; padding: 6px;" value="${u.meta_diaria || 15}" />
                  </td>
                  <td>
                    <button type="button" class="btn btn-primary btn-sm" onclick="salvarUsuarioAdmin('${u.id}')">Salvar</button>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function salvarUsuarioAdmin(userId) {
  const row = document.querySelector(`tr[data-user-id="${userId}"]`);
  if (!row) return;

  const ativo = row.querySelector(".usr-ativo").checked;
  const inicioVal = row.querySelector(".usr-inicio").value;
  const expVal = row.querySelector(".usr-expiracao").value;
  const grupo = Math.max(1, parseInt(row.querySelector(".usr-grupo").value, 10) || 1);
  const meta = Math.max(1, parseInt(row.querySelector(".usr-meta").value, 10) || 15);

  const payload = {
    ativo,
    data_inicio: inicioVal ? new Date(inicioVal).toISOString() : null,
    data_expiracao: expVal ? new Date(expVal).toISOString() : null,
    grupo_rotacao: grupo,
    meta_diaria: meta
  };

  const { error } = await supabaseClient.from("usuarios").update(payload).eq("id", userId);
  if (error) {
    mostrarAlertaAdmin("danger", `Erro ao atualizar terapeuta: ${error.message}`);
    return;
  }

  mostrarAlertaAdmin("success", "Configurações do terapeuta salvas com sucesso!");
  await carregarTudoAdmin();
}

function renderizarListaCategoriasAdmin() {
  const container = document.getElementById("listaCategoriasAdmin");
  if (!AdminState.categoriasPrincipais.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma categoria cadastrada.</div>`;
    return;
  }

  container.innerHTML = AdminState.categoriasPrincipais
    .map((cat) => {
      const subs = AdminState.subcategorias.filter((s) => s.categoria_principal_id === cat.id);
      return `
        <div class="safety-box" style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${cat.nome}</strong>
            <span class="badge badge-primary">${subs.length} subcategoria(s)</span>
          </div>
          <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
            ${
              subs.length
                ? subs.map((s) => `<span class="badge badge-neutral">${s.nome}</span>`).join("")
                : `<small style="color: var(--text-muted);">Sem subcategorias ainda</small>`
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderizarListaScriptsAdmin() {
  const container = document.getElementById("listaScriptsAdmin");
  if (!AdminState.scripts.length) {
    container.innerHTML = `<div class="empty-state">Nenhum script cadastrado.</div>`;
    return;
  }

  container.innerHTML = AdminState.scripts
    .map(
      (sc) => `
      <div class="safety-box" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <strong>${sc.titulo}</strong>
          <button type="button" class="btn btn-ghost btn-sm" onclick="excluirScriptAdmin('${sc.id}')">Excluir</button>
        </div>
        <div style="margin-top: 6px; white-space: pre-line;">${sc.mensagem}</div>
      </div>
    `
    )
    .join("");
}

async function excluirScriptAdmin(scriptId) {
  if (!confirm("Deseja remover este script?")) return;
  const { error } = await supabaseClient.from("scripts").delete().eq("id", scriptId);
  if (error) {
    mostrarAlertaAdmin("danger", `Erro ao excluir script: ${error.message}`);
    return;
  }
  await carregarTudoAdmin();
}

function renderizarRelatoriosTerapeutas() {
  const container = document.getElementById("tabelaRelatoriosContainer");
  const terapeutas = AdminState.usuarios.filter((u) => u.role === "terapeuta");

  if (!terapeutas.length) {
    container.innerHTML = `<div class="empty-state">Sem dados de terapeutas ainda.</div>`;
    return;
  }

  const linhas = terapeutas.map((u) => {
    const logs = AdminState.metricas.filter((m) => m.terapeuta_id === u.id);
    const copiados = logs.reduce((acc, l) => acc + (l.scripts_copiados || 0), 0);
    const abertos = logs.reduce((acc, l) => acc + (l.perfis_abertos || 0), 0);
    const engajados = logs.reduce((max, l) => Math.max(max, l.leads_engajados || 0), 0);
    const ultimoAcesso = logs.length ? new Date(logs[0].ultimo_acesso).toLocaleString("pt-BR") : "Nunca acessou";
    const temaMaisUsado = logs.find((l) => l.categoria_mais_usada)?.categoria_mais_usada || "-";

    return `
      <tr>
        <td><strong>${u.nome}</strong><br><small>${u.email}</small></td>
        <td>Grupo ${u.grupo_rotacao || 1}</td>
        <td><strong>${copiados}</strong></td>
        <td><strong>${abertos}</strong></td>
        <td><span class="badge badge-success">${engajados}</span></td>
        <td>${temaMaisUsado}</td>
        <td>${ultimoAcesso}</td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Terapeuta</th>
            <th>Grupo</th>
            <th>Scripts Copiados</th>
            <th>Perfis Abertos</th>
            <th>Engajados</th>
            <th>Tema Recente</th>
            <th>Último Acesso</th>
          </tr>
        </thead>
        <tbody>${linhas.join("")}</tbody>
      </table>
    </div>
  `;
}

function configurarFormulariosAdmin() {
  document.getElementById("importCatPrincipal").addEventListener("change", () => {
    sincronizarSubcategoriasSelect("importCatPrincipal", "importSubcategoria", false);
  });

  document.getElementById("scriptCatPrincipal").addEventListener("change", () => {
    sincronizarSubcategoriasSelect("scriptCatPrincipal", "scriptSubcategoria", true);
  });

  // Criar Categoria Principal
  document.getElementById("formNovaCategoriaPrincipal").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("catPrincipalNome").value.trim();
    const ordem = parseInt(document.getElementById("catPrincipalOrdem").value, 10) || 1;
    if (!nome) return;

    const { error } = await supabaseClient.from("categorias_principais").insert({
      nome,
      slug: criarSlug(nome),
      ordem,
      ativa: true
    });

    if (error) {
      mostrarAlertaAdmin("danger", `Erro ao criar categoria principal: ${error.message}`);
      return;
    }

    document.getElementById("catPrincipalNome").value = "";
    mostrarAlertaAdmin("success", `Categoria principal "${nome}" criada!`);
    await carregarTudoAdmin();
  });

  // Criar Subcategoria
  document.getElementById("formNovaSubcategoria").addEventListener("submit", async (e) => {
    e.preventDefault();
    const catId = document.getElementById("subCatPrincipalSelect").value;
    const nome = document.getElementById("subCatNome").value.trim();
    const ordem = parseInt(document.getElementById("subCatOrdem").value, 10) || 1;
    if (!catId || !nome) return;

    const { error } = await supabaseClient.from("subcategorias").insert({
      categoria_principal_id: catId,
      nome,
      slug: criarSlug(nome),
      ordem,
      ativa: true
    });

    if (error) {
      mostrarAlertaAdmin("danger", `Erro ao criar subcategoria: ${error.message}`);
      return;
    }

    document.getElementById("subCatNome").value = "";
    mostrarAlertaAdmin("success", `Subcategoria "${nome}" adicionada!`);
    await carregarTudoAdmin();
  });

  // Importar Perfis em Lote e distribuir em Blocos A/B/C/D
  document.getElementById("formImportarPerfis").addEventListener("submit", async (e) => {
    e.preventDefault();
    const catId = document.getElementById("importCatPrincipal").value;
    const subId = document.getElementById("importSubcategoria").value;
    const scorePadrao = parseInt(document.getElementById("importScorePadrao").value, 10) || 70;
    const textoLinhas = document.getElementById("importListaLinhas").value;

    if (!catId || !subId) {
      mostrarAlertaAdmin("warning", "Selecione a Categoria Principal e a Subcategoria.");
      return;
    }

    const linhas = textoLinhas
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (!linhas.length) return;

    const itensBrutos = linhas
      .map((linha) => {
        const partes = linha.split("|").map((p) => p.trim());
        const username = (partes[0] || "").replace(/^@/, "").toLowerCase();
        if (!username) return null;

        const nomeExibicao = partes[1] || username;
        const contexto = partes[2] || "";
        const scoreInformado = parseInt(partes[3], 10);
        const score = !Number.isNaN(scoreInformado) ? Math.max(1, Math.min(100, scoreInformado)) : scorePadrao;

        return {
          username,
          nome_exibicao: nomeExibicao,
          categoria_principal_id: catId,
          subcategoria_id: subId,
          contexto_comentario: contexto,
          score_engajamento: score,
          ativo: true
        };
      })
      .filter(Boolean);

    const itensComBloco = RotacaoService.distribuirBlocosEmLote(itensBrutos, AdminState.totalPerfisAtivos);

    const { error } = await supabaseClient
      .from("perfis_leads")
      .upsert(itensComBloco, { onConflict: "username", ignoreDuplicates: true });

    if (error) {
      mostrarAlertaAdmin("danger", `Erro ao importar perfis: ${error.message}`);
      return;
    }

    document.getElementById("importListaLinhas").value = "";
    mostrarAlertaAdmin("success", `${itensComBloco.length} perfil(is) processado(s) e distribuído(s) entre os blocos A, B, C e D!`);
    await carregarTudoAdmin();
  });

  // Salvar Novo Script
  document.getElementById("formNovoScript").addEventListener("submit", async (e) => {
    e.preventDefault();
    const catId = document.getElementById("scriptCatPrincipal").value || null;
    const subId = document.getElementById("scriptSubcategoria").value || null;
    const titulo = document.getElementById("scriptTitulo").value.trim();
    const mensagem = document.getElementById("scriptMensagem").value.trim();

    if (/https?:\/\/|www\./i.test(mensagem)) {
      const confirmar = confirm(
        "Detectamos um link na mensagem inicial. Enviar links na 1ª mensagem aumenta o risco de bloqueio no Instagram. Deseja salvar mesmo assim?"
      );
      if (!confirmar) return;
    }

    const { error } = await supabaseClient.from("scripts").insert({
      categoria_principal_id: catId,
      subcategoria_id: subId,
      titulo,
      mensagem,
      ativo: true
    });

    if (error) {
      mostrarAlertaAdmin("danger", `Erro ao salvar script: ${error.message}`);
      return;
    }

    document.getElementById("scriptTitulo").value = "";
    document.getElementById("scriptMensagem").value = "";
    mostrarAlertaAdmin("success", "Script salvo com sucesso!");
    await carregarTudoAdmin();
  });
}
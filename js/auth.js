// ============================================================================
// AUTENTICAÇÃO, CADASTRO (COM WHATSAPP), RECUPERAÇÃO E VALIDAÇÃO POR DATA
// ============================================================================

const AuthService = {
  // 1. Fazer Login
  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) throw error;

    const perfil = await this.obterPerfilUsuario(data.user.id);
    if (!perfil) {
      throw new Error("Perfil de usuário não encontrado no banco. Contate o suporte.");
    }

    if (perfil.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "app.html";
    }
  },

  // 2. Criar Conta (Nome, E-mail, WhatsApp e Senha)
  async cadastrar({ nome, email, whatsapp, password }) {
    const whatsappLimpo = whatsapp.replace(/\D/g, "");
    if (whatsappLimpo.length < 10) {
      throw new Error("Informe um número de WhatsApp válido com DDD.");
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nome: nome.trim(),
          whatsapp: whatsappLimpo
        }
      }
    });

    if (error) throw error;

    // Se o Supabase estiver sem exigência de confirmar e-mail, já redireciona
    if (data.session) {
      window.location.href = "app.html";
      return { redirecionado: true };
    }

    return { redirecionado: false };
  },

  // 3. Enviar e-mail de recuperação de senha
  async enviarRecuperacaoSenha(email) {
    // Monta a URL completa para funcionar corretamente no GitHub Pages (com subpasta)
    const urlBase = window.location.origin + window.location.pathname.replace(/[^/]*$/, "");
    const redirectTo = `${urlBase}recuperar-senha.html`;

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), {
      redirectTo
    });

    if (error) throw error;
  },

  // 4. Salvar nova senha após clicar no link do e-mail
  async atualizarSenha(novaSenha) {
    const { error } = await supabaseClient.auth.updateUser({
      password: novaSenha
    });

    if (error) throw error;
  },

  // 5. Sair da conta
  async logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  },

  // 6. Buscar dados da tabela public.usuarios
  async obterPerfilUsuario(userId) {
    const { data, error } = await supabaseClient
      .from("usuarios")
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao buscar perfil:", error);
      return null;
    }
    return data;
  },

  // 7. Verificar se o acesso do terapeuta está ativo e dentro da janela de datas
  verificarValidadeAcesso(perfil) {
    if (!perfil) {
      return { valido: false, motivo: "perfil_inexistente", mensagem: "Cadastro não localizado." };
    }

    if (perfil.role === "admin") {
      return { valido: true, motivo: "admin" };
    }

    if (!perfil.ativo) {
      return {
        valido: false,
        motivo: "inativo",
        mensagem: "Seu cadastro está aguardando ativação pelo administrador."
      };
    }

    const agora = new Date();

    if (perfil.data_inicio) {
      const inicio = new Date(perfil.data_inicio);
      if (agora < inicio) {
        return {
          valido: false,
          motivo: "antes_inicio",
          mensagem: `Seu acesso está agendado para iniciar em ${inicio.toLocaleDateString("pt-BR")}.`
        };
      }
    }

    if (perfil.data_expiracao) {
      const expiracao = new Date(perfil.data_expiracao);
      if (agora > expiracao) {
        return {
          valido: false,
          motivo: "expirado",
          mensagem: `Seu período de acesso encerrou em ${expiracao.toLocaleDateString("pt-BR")}.`
        };
      }
    }

    return { valido: true, motivo: "ok" };
  },

  // 8. Proteger rotas privadas (app.html e admin.html)
  async protegerRota({ exigirAdmin = false } = {}) {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
      window.location.href = "login.html";
      return null;
    }

    const perfil = await this.obterPerfilUsuario(session.user.id);
    if (!perfil) {
      await this.logout();
      return null;
    }

    if (exigirAdmin && perfil.role !== "admin") {
      window.location.href = "app.html";
      return null;
    }

    const statusAcesso = this.verificarValidadeAcesso(perfil);
    return { session, perfil, statusAcesso };
  }
};
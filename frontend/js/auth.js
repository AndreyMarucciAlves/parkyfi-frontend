/**
 * Modulo de Autenticacao e Seguranca
 * Telas de Login, Cadastro e Recuperacao de Senha.
 */

class AuthService {
  constructor() {
    this.recoveryData = null;
  }

  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = window.StorageManager.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Usuario nao cadastrado no sistema.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Senha incorreta. Tente novamente.' };
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'Operador',
    };

    window.StorageManager.saveSession(session);
    return { success: true, user: session };
  }

  register({ name, email, password, confirmPassword }) {
    if (!name || name.trim().length < 2) {
      return { success: false, message: 'Informe o nome completo.' };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Informe um endereco de e-mail valido.' };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'A senha deve ter no minimo 4 caracteres.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'As senhas informadas nao coincidem.' };
    }

    const users = window.StorageManager.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Este e-mail ja esta em uso por outro usuario.' };
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: 'Operador',
    };

    users.push(newUser);
    window.StorageManager.saveUsers(users);

    return { success: true, message: 'Usuario cadastrado com sucesso. Faca o login para acessar.' };
  }

  requestPasswordReset(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = window.StorageManager.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Nenhuma conta localizada para este e-mail.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.recoveryData = {
      email: cleanEmail,
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    return {
      success: true,
      message: 'Codigo de verificacao emitido.',
      code,
    };
  }

  verifyResetCode(code) {
    if (!this.recoveryData) {
      return { success: false, message: 'Solicitacao nao encontrada. Reinicie o processo.' };
    }

    if (Date.now() > this.recoveryData.expiresAt) {
      return { success: false, message: 'O codigo informado expirou. Solicite novamente.' };
    }

    if (this.recoveryData.code !== (code || '').trim()) {
      return { success: false, message: 'Codigo de verificacao invalido.' };
    }

    return { success: true, message: 'Codigo validado com sucesso.' };
  }

  resetPassword(newPassword, confirmPassword) {
    if (!this.recoveryData) {
      return { success: false, message: 'Sessao de recuperacao invalida.' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'A nova senha deve ter no minimo 4 caracteres.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: 'As senhas informadas nao coincidem.' };
    }

    const users = window.StorageManager.getUsers();
    const target = users.find(u => u.email.toLowerCase() === this.recoveryData.email);

    if (target) {
      target.password = newPassword;
      window.StorageManager.saveUsers(users);
    }

    this.recoveryData = null;
    return { success: true, message: 'Senha redefinida com sucesso. Entre com a nova senha.' };
  }

  logout() {
    window.StorageManager.saveSession(null);
  }

  getCurrentSession() {
    return window.StorageManager.getSession();
  }
}

window.authService = new AuthService();

/**
 * Consultoria Patrimonial - Erlane Mota | Seu Filho aos 18 Anos
 * Single Page Application Logic
 */

(function () {
  'use strict';

  // --- 1. SEGURANÇA E SANITIZAÇÃO (ANTI-XSS) ---
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, function (tag) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag);
    });
  }

  function sanitizeUrl(url) {
    if (typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('tel:') || trimmed.startsWith('mailto:')) {
      return trimmed;
    }
    return '#';
  }

  // Toast Helper
  function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(16px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- 2. DADOS E ESTADO PADRÃO DO SITE ---
  const WHATSAPP_NUM = "5538997373140";
  const DEFAULT_STATE = {
    hero: {
      tag: "Para mães e pais que pensam no futuro do filho",
      title: "Seu filho com 18 anos, com dinheiro para seu primeiro AP ou seu carro.",
      subtitle: "Um plano para você construir hoje, com uma parcela que cabe na sua renda, para quando seu filho fizer 18 anos ele já ter seu valor para escolher: seu primeiro AP ou seu carro.",
    },
    sim: {
      target: "Primeiro Apartamento",
      childAge: 1,
      minCredit: 200000,
      monthlyEstimate: 980
    },
    admin: {
      passwordHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", // 'test' / 'erlane2026'
      failedAttempts: 0,
      lockoutUntil: 0,
      emergencyKey: "ERLANE-2026-SEGURA"
    }
  };

  // Carrega ou inicializa o estado no LocalStorage com auto-recuperação
  function getAppConfig() {
    try {
      const saved = localStorage.getItem('erlane_fi_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Recuperando config padrão:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveAppConfig(cfg) {
    try {
      localStorage.setItem('erlane_fi_config', JSON.stringify(cfg));
    } catch (e) {
      console.error("Erro ao salvar config:", e);
    }
  }

  // --- 3. CALCULADORA INTERATIVA ("Monte seu Ponto de Partida") ---
  let selectedGoal = "Primeiro Apartamento";
  let currentChildAge = 1;

  window.setSimGoal = function (goal) {
    selectedGoal = goal;
    document.querySelectorAll('.sim-goal-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-goal') === goal;
      if (isTarget) {
        btn.classList.add('bg-[#5A1220]', 'text-white', 'shadow-md');
        btn.classList.remove('bg-white', 'text-[#5A1220]', 'border-[#C9A86A]/40');
      } else {
        btn.classList.remove('bg-[#5A1220]', 'text-white', 'shadow-md');
        btn.classList.add('bg-white', 'text-[#5A1220]', 'border-[#C9A86A]/40');
      }
    });
    updateSimulator();
  };

  window.onChildAgeChange = function (val) {
    currentChildAge = parseInt(val, 10);
    const ageLabel = document.getElementById('child-age-display');
    if (ageLabel) {
      ageLabel.textContent = currentChildAge === 0 ? "Recém-nascido (< 1 ano)" : `${currentChildAge} ${currentChildAge === 1 ? 'ano' : 'anos'}`;
    }
    updateSimulator();
  };

  function updateSimulator() {
    const yearsRemaining = Math.max(4, 18 - currentChildAge);
    const monthsRemaining = yearsRemaining * 12;

    let targetCreditText = "";
    let estimatedParcelText = "";
    let goalShort = "";

    if (selectedGoal === "Primeiro Apartamento") {
      goalShort = "primeiro apartamento";
      targetCreditText = "R$ 220.000 a R$ 380.000";
      // Ajuste proporcional ao prazo restante
      const factor = 18 / yearsRemaining;
      const baseParcel = Math.round(980 * factor);
      estimatedParcelText = `A partir de R$ ${baseParcel.toLocaleString('pt-BR')}/mês`;
    } else if (selectedGoal === "Primeiro Carro") {
      goalShort = "primeiro carro";
      targetCreditText = "R$ 70.000 a R$ 120.000";
      const factor = 18 / yearsRemaining;
      const baseParcel = Math.round(390 * factor);
      estimatedParcelText = `A partir de R$ ${baseParcel.toLocaleString('pt-BR')}/mês`;
    } else {
      goalShort = "capital livre / reserva de maioridade";
      targetCreditText = "R$ 150.000 a R$ 250.000";
      const factor = 18 / yearsRemaining;
      const baseParcel = Math.round(650 * factor);
      estimatedParcelText = `A partir de R$ ${baseParcel.toLocaleString('pt-BR')}/mês`;
    }

    // Atualiza elementos visuais do card da calculadora
    const creditEl = document.getElementById('sim-target-credit');
    if (creditEl) creditEl.textContent = targetCreditText;

    const parcelEl = document.getElementById('sim-estimated-parcel');
    if (parcelEl) parcelEl.textContent = estimatedParcelText;

    const termEl = document.getElementById('sim-estimated-term');
    if (termEl) termEl.textContent = `${monthsRemaining} meses (~${yearsRemaining} anos)`;

    // Monta o resumo local que o usuário pode copiar ou enviar
    const ageText = currentChildAge === 0 ? "recém-nascido" : `${currentChildAge} ${currentChildAge === 1 ? 'ano' : 'anos'}`;
    const summaryText = `Meu plano para meu filho (${ageText}): objetivo ${goalShort}. Prazo estimado de ${monthsRemaining} meses até os 18 anos. Quero um diagnóstico gratuito com a Erlane Mota com uma parcela que cabe na minha renda atual.`;
    
    const textarea = document.getElementById('sim-summary-textarea');
    if (textarea) textarea.value = summaryText;

    // Atualiza link do WhatsApp
    const waBtn = document.getElementById('sim-whatsapp-btn');
    if (waBtn) {
      const encoded = encodeURIComponent(summaryText);
      waBtn.href = `https://wa.me/${WHATSAPP_NUM}?text=${encoded}`;
    }
  }

  window.copySimulatorSummary = function () {
    const textarea = document.getElementById('sim-summary-textarea');
    if (!textarea) return;
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      const copyBtn = document.getElementById('sim-copy-btn');
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span>Resumo Copiado ✓</span>';
        copyBtn.classList.add('bg-emerald-700');
        showToast("Resumo copiado com sucesso!");
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove('bg-emerald-700');
        }, 2500);
      }
    }).catch(() => {
      showToast("Selecione o texto e copie manualmente.");
    });
  };

  // --- 4. ABAS DE USO NO FINAL (ÁGIO VS QUITAÇÃO) ---
  window.selectUsageTab = function (tab) {
    const cardAgio = document.getElementById('card-usage-agio');
    const cardQuitacao = document.getElementById('card-usage-quitacao');
    const btnAgio = document.getElementById('btn-tab-agio');
    const btnQuitacao = document.getElementById('btn-tab-quitacao');

    if (tab === 'agio') {
      if (cardAgio) cardAgio.classList.add('ring-2', 'ring-[#C9A86A]', 'shadow-xl', 'bg-white');
      if (cardQuitacao) cardQuitacao.classList.remove('ring-2', 'ring-[#C9A86A]', 'shadow-xl');
      if (btnAgio) {
        btnAgio.classList.add('bg-[#5A1220]', 'text-white');
        btnAgio.classList.remove('bg-white', 'text-[#5A1220]');
      }
      if (btnQuitacao) {
        btnQuitacao.classList.remove('bg-[#5A1220]', 'text-white');
        btnQuitacao.classList.add('bg-white', 'text-[#5A1220]');
      }
    } else {
      if (cardQuitacao) cardQuitacao.classList.add('ring-2', 'ring-[#C9A86A]', 'shadow-xl', 'bg-white');
      if (cardAgio) cardAgio.classList.remove('ring-2', 'ring-[#C9A86A]', 'shadow-xl');
      if (btnQuitacao) {
        btnQuitacao.classList.add('bg-[#5A1220]', 'text-white');
        btnQuitacao.classList.remove('bg-white', 'text-[#5A1220]');
      }
      if (btnAgio) {
        btnAgio.classList.remove('bg-[#5A1220]', 'text-white');
        btnAgio.classList.add('bg-white', 'text-[#5A1220]');
      }
    }
  };

  // --- 5. FAQ ACCORDION ---
  window.toggleFaq = function (index) {
    const body = document.getElementById(`faq-body-${index}`);
    const icon = document.getElementById(`faq-icon-${index}`);
    if (!body || !icon) return;

    const isHidden = body.classList.contains('hidden');
    // Fecha todos os outros para manter leitura limpa
    document.querySelectorAll('[id^="faq-body-"]').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="faq-icon-"]').forEach(el => el.style.transform = 'rotate(0deg)');

    if (isHidden) {
      body.classList.remove('hidden');
      icon.style.transform = 'rotate(180deg)';
    }
  };

  // --- 6. VÍDEO PLAYER CONTROLS ---
  window.toggleVideoPlay = function () {
    const video = document.getElementById('family-video');
    const playBtn = document.getElementById('video-play-btn');
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        if (playBtn) playBtn.innerHTML = `
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        `;
      }).catch(err => console.log("Vídeo autoplay bloqueado:", err));
    } else {
      video.pause();
      if (playBtn) playBtn.innerHTML = `
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
    }
  };

  window.toggleVideoMute = function () {
    const video = document.getElementById('family-video');
    const muteBtn = document.getElementById('video-mute-btn');
    if (!video) return;
    video.muted = !video.muted;
    if (muteBtn) {
      muteBtn.textContent = video.muted ? "🔇 Som desligado" : "🔊 Som ligado";
    }
  };

  // --- 7. PAINEL ADMINISTRATIVO BLINDADO ---
  let adminSessionActive = false;

  window.openAdminModal = function () {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    renderAdminView();
  };

  window.closeAdminModal = function () {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  // SHA-256 para checagem de senha
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function checkLockout() {
    const config = getAppConfig();
    const now = Date.now();
    if (config.admin.lockoutUntil && config.admin.lockoutUntil > now) {
      const remainingMinutes = Math.ceil((config.admin.lockoutUntil - now) / 60000);
      return remainingMinutes;
    }
    return 0;
  }

  function renderAdminView() {
    const content = document.getElementById('admin-modal-content');
    if (!content) return;

    const lockedMinutes = checkLockout();
    if (lockedMinutes > 0) {
      content.innerHTML = `
        <div class="p-8 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-2xl">🔒</div>
          <h3 class="font-serif text-2xl font-bold text-[#5A1220] mb-2">Painel Temporariamente Bloqueado</h3>
          <p class="text-sm text-[#6B5A5E] mb-4">Excesso de tentativas incorretas. Por segurança, tente novamente em <strong>${lockedMinutes} minutos</strong>.</p>
          <button onclick="closeAdminModal();" class="px-6 py-2.5 rounded-full bg-[#5A1220] text-white font-bold text-sm">Fechar</button>
        </div>
      `;
      return;
    }

    if (!adminSessionActive) {
      content.innerHTML = `
        <div class="p-6 sm:p-8">
          <div class="flex items-center justify-between pb-4 border-b border-[#C9A86A]/20 mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#5A1220] text-[#C9A86A] font-serif font-bold">EM</span>
              <div>
                <h3 class="font-serif text-xl font-bold text-[#5A1220]">Acesso Administrativo</h3>
                <p class="text-xs text-[#8A6E3E] uppercase tracking-wider font-semibold">Painel Blindado</p>
              </div>
            </div>
            <button onclick="closeAdminModal();" class="text-gray-400 hover:text-gray-700 p-2 text-xl font-bold">&times;</button>
          </div>

          <form onsubmit="handleAdminLogin(event);" class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-[#6B5A5E] mb-1">Senha de Acesso</label>
              <input type="password" id="admin-pass-input" required autofocus placeholder="Digite sua senha de acesso"
                class="w-full px-4 py-3 rounded-xl border border-[#C9A86A]/40 focus:outline-none focus:ring-2 focus:ring-[#5A1220] text-sm bg-[#FAF6EF]">
            </div>
            <div id="login-error-msg" class="text-xs text-red-600 font-semibold hidden"></div>
            <button type="submit" class="w-full py-3.5 rounded-full bg-[#5A1220] text-white font-bold text-sm shadow hover:bg-[#6E1A2B] transition">
              Entrar no Painel
            </button>
          </form>

          <div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <button onclick="renderForgotPassView();" class="text-[#8A6E3E] hover:underline font-semibold">Esqueci minha senha</button>
            <span class="text-gray-400">Proteção anti-força bruta ativa</span>
          </div>
        </div>
      `;
    } else {
      renderAdminDashboard();
    }
  }

  window.handleAdminLogin = async function (e) {
    e.preventDefault();
    const input = document.getElementById('admin-pass-input');
    const errEl = document.getElementById('login-error-msg');
    if (!input) return;

    const entered = input.value.trim();
    const hash = await sha256(entered);
    const config = getAppConfig();

    // Senha padrão aceita: 'erlane2026' ou o hash cadastrado
    const defaultPassHash = await sha256("erlane2026");

    if (hash === config.admin.passwordHash || hash === defaultPassHash || entered === "erlane2026") {
      adminSessionActive = true;
      config.admin.failedAttempts = 0;
      saveAppConfig(config);
      showToast("Login administrativo realizado!");
      renderAdminDashboard();
    } else {
      config.admin.failedAttempts = (config.admin.failedAttempts || 0) + 1;
      const remaining = 5 - config.admin.failedAttempts;
      if (config.admin.failedAttempts >= 5) {
        config.admin.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutos
        saveAppConfig(config);
        renderAdminView();
      } else {
        saveAppConfig(config);
        if (errEl) {
          errEl.textContent = `Senha incorreta. ${remaining} tentativas restantes antes do bloqueio.`;
          errEl.classList.remove('hidden');
        }
      }
    }
  };

  window.renderForgotPassView = function () {
    const content = document.getElementById('admin-modal-content');
    if (!content) return;
    content.innerHTML = `
      <div class="p-6 sm:p-8">
        <h3 class="font-serif text-xl font-bold text-[#5A1220] mb-2">Recuperação de Acesso</h3>
        <p class="text-xs text-[#6B5A5E] mb-4">Informe a Chave Mestra de Emergência para redefinir sua senha.</p>
        <form onsubmit="handleEmergencyReset(event);" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-[#6B5A5E] mb-1">Chave Mestra</label>
            <input type="text" id="emergency-key-input" required placeholder="Digite a chave mestra"
              class="w-full px-4 py-3 rounded-xl border border-[#C9A86A]/40 text-sm bg-[#FAF6EF]">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-[#6B5A5E] mb-1">Nova Senha</label>
            <input type="password" id="new-emergency-pass" required placeholder="Crie uma nova senha"
              class="w-full px-4 py-3 rounded-xl border border-[#C9A86A]/40 text-sm bg-[#FAF6EF]">
          </div>
          <div id="reset-err-msg" class="text-xs text-red-600 font-semibold hidden"></div>
          <button type="submit" class="w-full py-3 rounded-full bg-[#5A1220] text-white font-bold text-sm">
            Redefinir Senha
          </button>
        </form>
        <div class="mt-4 text-center">
          <button onclick="renderAdminView();" class="text-xs text-[#8A6E3E] font-semibold hover:underline">Voltar ao login</button>
        </div>
      </div>
    `;
  };

  window.handleEmergencyReset = async function (e) {
    e.preventDefault();
    const keyInput = document.getElementById('emergency-key-input');
    const passInput = document.getElementById('new-emergency-pass');
    const errEl = document.getElementById('reset-err-msg');
    const config = getAppConfig();

    if (keyInput.value.trim() === config.admin.emergencyKey || keyInput.value.trim() === "ERLANE-2026-SEGURA") {
      config.admin.passwordHash = await sha256(passInput.value.trim());
      config.admin.failedAttempts = 0;
      config.admin.lockoutUntil = 0;
      saveAppConfig(config);
      showToast("Senha redefinida com sucesso!");
      adminSessionActive = true;
      renderAdminDashboard();
    } else {
      if (errEl) {
        errEl.textContent = "Chave mestra inválida. Verifique seus dados cadastrais.";
        errEl.classList.remove('hidden');
      }
    }
  };

  function renderAdminDashboard() {
    const content = document.getElementById('admin-modal-content');
    if (!content) return;
    const config = getAppConfig();

    content.innerHTML = `
      <div class="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        <!-- Top Bar Admin -->
        <div class="flex flex-wrap items-center justify-between pb-4 border-b border-[#C9A86A]/20 gap-3 mb-6">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#5A1220] text-[#C9A86A] font-serif font-bold">EM</span>
            <div>
              <h3 class="font-serif text-xl font-bold text-[#5A1220]">Painel da Consultora</h3>
              <p class="text-xs text-[#8A6E3E] font-semibold">Sessão Autenticada</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="adminLogout();" class="px-3.5 py-1.5 rounded-full border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold">
              Sair
            </button>
            <button onclick="closeAdminModal();" class="text-gray-400 hover:text-gray-700 p-2 text-xl font-bold">&times;</button>
          </div>
        </div>

        <!-- Abas do Dashboard -->
        <div class="flex gap-2 border-b border-gray-200 pb-3 mb-6 overflow-x-auto text-xs font-bold uppercase tracking-wider">
          <button onclick="switchAdminTab('content');" id="tab-btn-content" class="px-4 py-2 rounded-xl bg-[#5A1220] text-white">Conteúdo Hero</button>
          <button onclick="switchAdminTab('media');" id="tab-btn-media" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700">Mídias</button>
          <button onclick="switchAdminTab('security');" id="tab-btn-security" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700">Segurança</button>
        </div>

        <!-- Conteúdo Aba Content -->
        <div id="admin-sec-content" class="space-y-4">
          <h4 class="font-serif text-lg font-bold text-[#5A1220]">Textos Principais do Topo</h4>
          <div>
            <label class="block text-xs font-bold text-[#6B5A5E] mb-1">Título Hero</label>
            <textarea id="adm-hero-title" rows="2" class="w-full p-3 rounded-xl border border-gray-200 text-sm">${escapeHTML(config.hero.title)}</textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-[#6B5A5E] mb-1">Subtítulo Hero</label>
            <textarea id="adm-hero-sub" rows="3" class="w-full p-3 rounded-xl border border-gray-200 text-sm">${escapeHTML(config.hero.subtitle)}</textarea>
          </div>
          <button onclick="saveAdminHeroContent();" class="px-6 py-2.5 rounded-full bg-[#5A1220] text-white font-bold text-sm shadow hover:bg-[#6E1A2B]">
            Salvar Alterações
          </button>
        </div>

        <!-- Conteúdo Aba Media -->
        <div id="admin-sec-media" class="space-y-4 hidden">
          <h4 class="font-serif text-lg font-bold text-[#5A1220]">Gerenciador Universal de Mídias</h4>
          <p class="text-xs text-[#6B5A5E]">Suba novas fotos do dispositivo ou informe links diretos do Google Drive/Dropbox.</p>
          
          <div class="p-4 rounded-2xl bg-[#FAF6EF] border border-[#C9A86A]/30 space-y-3">
            <label class="block text-xs font-bold text-[#5A1220]">Upload de Foto Local (Celular/Computador)</label>
            <input type="file" id="adm-file-upload" accept="image/*" class="text-xs text-gray-600" onchange="handleAdminFileUpload(event);">
            <div id="adm-upload-preview" class="hidden mt-2">
              <img id="adm-preview-img" src="" class="h-28 rounded-xl object-cover border border-[#C9A86A]/40">
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
            <label class="block text-xs font-bold text-[#5A1220]">Link do Google Drive / Dropbox</label>
            <div class="flex gap-2">
              <input type="url" id="adm-drive-link" placeholder="Cole o link de compartilhamento" class="flex-1 p-2.5 rounded-xl border border-gray-200 text-xs">
              <button onclick="convertDriveLink();" class="px-4 py-2 rounded-xl bg-[#C9A86A] text-[#5A1220] font-bold text-xs">Converter</button>
            </div>
            <p id="drive-convert-res" class="text-xs text-emerald-700 font-semibold hidden"></p>
          </div>
        </div>

        <!-- Conteúdo Aba Security -->
        <div id="admin-sec-security" class="space-y-4 hidden">
          <h4 class="font-serif text-lg font-bold text-[#5A1220]">Alteração de Senha</h4>
          <form onsubmit="handleAdminChangePass(event);" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-[#6B5A5E] mb-1">Nova Senha</label>
              <input type="password" id="adm-new-pass" required placeholder="Nova senha segura" class="w-full p-3 rounded-xl border border-gray-200 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-[#6B5A5E] mb-1">Confirmar Nova Senha</label>
              <input type="password" id="adm-confirm-pass" required placeholder="Repita a nova senha" class="w-full p-3 rounded-xl border border-gray-200 text-sm">
            </div>
            <button type="submit" class="px-6 py-2.5 rounded-full bg-[#5A1220] text-white font-bold text-sm shadow">
              Atualizar Senha
            </button>
          </form>
        </div>
      </div>
    `;
  }

  window.switchAdminTab = function (tab) {
    const tabs = ['content', 'media', 'security'];
    tabs.forEach(t => {
      const sec = document.getElementById(`admin-sec-${t}`);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (t === tab) {
        if (sec) sec.classList.remove('hidden');
        if (btn) {
          btn.classList.add('bg-[#5A1220]', 'text-white');
          btn.classList.remove('bg-gray-100', 'text-gray-700');
        }
      } else {
        if (sec) sec.classList.add('hidden');
        if (btn) {
          btn.classList.remove('bg-[#5A1220]', 'text-white');
          btn.classList.add('bg-gray-100', 'text-gray-700');
        }
      }
    });
  };

  window.saveAdminHeroContent = function () {
    const title = document.getElementById('adm-hero-title').value.trim();
    const sub = document.getElementById('adm-hero-sub').value.trim();
    if (!title || !sub) return;

    const config = getAppConfig();
    config.hero.title = title;
    config.hero.subtitle = sub;
    saveAppConfig(config);

    // Atualiza DOM público sem reload
    const heroTitleEl = document.getElementById('hero-title-main');
    if (heroTitleEl) heroTitleEl.textContent = title;

    const heroSubEl = document.getElementById('hero-subtitle-main');
    if (heroSubEl) heroSubEl.textContent = sub;

    showToast("Conteúdo atualizado com sucesso!");
  };

  window.handleAdminFileUpload = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const b64 = evt.target.result;
      const preview = document.getElementById('adm-upload-preview');
      const img = document.getElementById('adm-preview-img');
      if (preview && img) {
        img.src = b64;
        preview.classList.remove('hidden');
      }
      showToast("Foto carregada com sucesso no preview.");
    };
    reader.readAsDataURL(file);
  };

  window.convertDriveLink = function () {
    const input = document.getElementById('adm-drive-link');
    const resEl = document.getElementById('drive-convert-res');
    if (!input || !resEl) return;

    let url = input.value.trim();
    // Conversão Google Drive
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      const direct = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
      resEl.textContent = `Link direto gerado: ${direct}`;
      resEl.classList.remove('hidden');
      showToast("Link do Drive convertido!");
      return;
    }
    // Conversão Dropbox
    if (url.includes('dropbox.com')) {
      const direct = url.replace('dl=0', 'raw=1');
      resEl.textContent = `Link direto gerado: ${direct}`;
      resEl.classList.remove('hidden');
      showToast("Link do Dropbox convertido!");
      return;
    }
    resEl.textContent = "URL mantida como link web direto.";
    resEl.classList.remove('hidden');
  };

  window.handleAdminChangePass = async function (e) {
    e.preventDefault();
    const p1 = document.getElementById('adm-new-pass').value.trim();
    const p2 = document.getElementById('adm-confirm-pass').value.trim();

    if (p1.length < 6) {
      showToast("A senha deve conter no mínimo 6 caracteres.");
      return;
    }
    if (p1 !== p2) {
      showToast("As senhas não coincidem.");
      return;
    }

    const config = getAppConfig();
    config.admin.passwordHash = await sha256(p1);
    saveAppConfig(config);
    showToast("Senha alterada com sucesso!");
  };

  window.adminLogout = function () {
    adminSessionActive = false;
    showToast("Sessão encerrada.");
    renderAdminView();
  };

  // --- 8. INICIALIZAÇÃO NO CARREGAMENTO DA PÁGINA ---
  document.addEventListener('DOMContentLoaded', function () {
    // Aplica configurações salvas no hero caso existam
    const config = getAppConfig();
    const heroTitleEl = document.getElementById('hero-title-main');
    if (heroTitleEl && config.hero && config.hero.title) {
      heroTitleEl.textContent = config.hero.title;
    }
    const heroSubEl = document.getElementById('hero-subtitle-main');
    if (heroSubEl && config.hero && config.hero.subtitle) {
      heroSubEl.textContent = config.hero.subtitle;
    }

    // Inicializa calculadora
    updateSimulator();

    // Fecha modal clicando no backdrop
    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          closeAdminModal();
        }
      });
    }

    // Atalho de teclado ESC para fechar modais
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAdminModal();
      }
    });
  });

})();

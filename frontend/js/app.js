/**
 * Controlador da Aplicacao de Estacionamento (ParkControl)
 * Garante sincronizacao imediata de abas, filtros de secao e busca.
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  activeSection: 'all',
  searchTerm: '',
  currentTab: 'map',
  selectedSpot: null,
  activeCheckoutCalc: null,
  clockTimer: null,

  init() {
    this.setupLoginUI();
    this.setupAppUI();
    this.startClock();
  },

  /* -------------------------------------------------------------------------
   * LOGIN DE DEMONSTRACAO
   * Nao ha autenticacao: o navegador valida o e-mail (type="email" + required)
   * e o envio do formulario apenas exibe a tela operacional.
   * ------------------------------------------------------------------------- */
  setupLoginUI() {
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showApp();
      });
    }
  },

  showApp() {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-app').classList.remove('hidden');
    this.switchViewTab(this.currentTab);
    this.render();
  },

  /* -------------------------------------------------------------------------
   * INTERACAO DE MENUS E ABAS
   * ------------------------------------------------------------------------- */
  setupAppUI() {
    // Alternancia entre as abas principais (Mapa de Vagas, Veiculos Estacionados, Historico)
    document.querySelectorAll('[data-view-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-view-tab');
        this.switchViewTab(tab);
      });
    });

    // Filtros de Secao (Todas, Secao A, Secao B, Secao C)
    document.querySelectorAll('[data-filter-sec]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-sec]').forEach(b => {
          b.classList.remove('btn-sec-active');
          b.classList.add('btn-sec-inactive');
        });
        btn.classList.add('btn-sec-active');
        btn.classList.remove('btn-sec-inactive');

        this.activeSection = btn.getAttribute('data-filter-sec');
        this.renderSpots();
        this.renderTable();
      });
    });

    // Campo de Busca Unificado (Funciona para mapa, tabela e historico)
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.trim().toUpperCase();
        this.renderSpots();
        this.renderTable();
        this.renderHistory();
      });
    }

    // Botoes de Check-in (Nova Entrada)
    const btnOpenCheckin = document.getElementById('btn-open-checkin');
    if (btnOpenCheckin) {
      btnOpenCheckin.addEventListener('click', () => {
        this.openCheckinModal();
      });
    }

    const btnHeaderQuickEntry = document.getElementById('btn-header-quick-entry');
    if (btnHeaderQuickEntry) {
      btnHeaderQuickEntry.addEventListener('click', () => {
        this.openCheckinModal();
      });
    }

    // Confirmacao do Check-in
    const formCheckin = document.getElementById('form-checkin');
    if (formCheckin) {
      formCheckin.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitCheckin();
      });
    }

    // Confirmacao do Check-out
    const btnConfirmCheckout = document.getElementById('btn-confirm-checkout');
    if (btnConfirmCheckout) {
      btnConfirmCheckout.addEventListener('click', () => {
        this.submitCheckout();
      });
    }

    // Botoes de fechar modais
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        document.getElementById(modalId).classList.add('hidden');
      });
    });
  },

  switchViewTab(tab) {
    this.currentTab = tab;
    const tabs = ['map', 'table', 'history'];

    tabs.forEach(t => {
      const panel = document.getElementById(`tab-panel-${t}`);
      const btn = document.querySelector(`[data-view-tab="${t}"]`);

      if (panel) {
        if (t === tab) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }

      if (btn) {
        if (t === tab) {
          btn.classList.add('tab-btn-active');
          btn.classList.remove('tab-btn-inactive');
        } else {
          btn.classList.remove('tab-btn-active');
          btn.classList.add('tab-btn-inactive');
        }
      }
    });

    // Renderiza os dados da aba ativada
    this.render();
  },

  render() {
    this.updateStats();
    if (this.currentTab === 'map') {
      this.renderSpots();
    } else if (this.currentTab === 'table') {
      this.renderTable();
    } else if (this.currentTab === 'history') {
      this.renderHistory();
    }
  },

  updateStats() {
    const spots = window.StorageManager.getSpots();
    const history = window.StorageManager.getHistory();

    const total = spots.length;
    const occupied = spots.filter(s => s.status === 'ocupada').length;
    const free = total - occupied;

    const todayStr = new Date().toISOString().slice(0, 10);
    const revenueToday = history
      .filter(h => h.exitTime && h.exitTime.slice(0, 10) === todayStr)
      .reduce((acc, h) => acc + (h.amount || 0), 0);

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-occupied').textContent = occupied;
    document.getElementById('stat-free').textContent = free;
    document.getElementById('stat-revenue').textContent = `R$ ${revenueToday.toFixed(2).replace('.', ',')}`;
  },

  /* -------------------------------------------------------------------------
   * RENDERIZACAO DO GRID DE VAGAS
   * ------------------------------------------------------------------------- */
  renderSpots() {
    const container = document.getElementById('grid-spots');
    if (!container) return;

    let spots = window.StorageManager.getSpots();

    // Filtro por Secao
    if (this.activeSection !== 'all') {
      spots = spots.filter(s => s.section === this.activeSection);
    }

    // Filtro por Busca (Placa, Vaga ou Cliente)
    if (this.searchTerm) {
      spots = spots.filter(s => {
        const spotId = s.number.toUpperCase();
        const plate = s.current ? s.current.plate.toUpperCase() : '';
        const client = s.current ? (s.current.clientName || '').toUpperCase() : '';
        return spotId.includes(this.searchTerm) || plate.includes(this.searchTerm) || client.includes(this.searchTerm);
      });
    }

    if (spots.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-500 text-xs">
          Nenhuma vaga localizada para os filtros selecionados.
        </div>
      `;
      return;
    }

    container.innerHTML = spots.map(s => {
      const isOcc = s.status === 'ocupada';

      let durationLabel = '';
      if (isOcc && s.current) {
        const diffMs = Date.now() - new Date(s.current.entryTime).getTime();
        const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        durationLabel = `${h}h ${m.toString().padStart(2, '0')}m`;
      }

      return `
        <div class="spot-card-item border rounded-lg p-3.5 select-none cursor-pointer ${
          isOcc 
            ? 'border-red-300 bg-red-50/60 hover:border-red-400' 
            : 'border-slate-200 bg-white hover:border-slate-400'
        }" onclick="App.handleSpotClick('${s.id}')">
          
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <span class="font-mono font-bold text-base text-slate-900">${s.number}</span>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded ${
              isOcc ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }">
              ${isOcc ? 'Ocupada' : 'Disponivel'}
            </span>
          </div>

          <div class="pt-2 text-xs">
            ${isOcc && s.current ? `
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                    ${s.current.plate}
                  </span>
                  <span class="text-red-700 font-bold text-xs">${durationLabel}</span>
                </div>
                <p class="text-slate-600 truncate mt-1">
                  Cliente: <span class="font-medium text-slate-900">${s.current.clientName || 'Avulso'}</span>
                </p>
                <div class="pt-2 mt-2 border-t border-red-200 flex justify-between items-center text-[11px] text-red-800 font-semibold">
                  <span>Registrar Saida</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ` : `
              <div class="py-3 text-center text-slate-500">
                <p class="font-semibold text-slate-800">Clique para Entrada</p>
                <p class="text-[11px] text-slate-400 mt-0.5">${s.sectionLabel}</p>
              </div>
            `}
          </div>

        </div>
      `;
    }).join('');
  },

  handleSpotClick(spotId) {
    const spots = window.StorageManager.getSpots();
    const spot = spots.find(s => s.id === spotId);
    if (!spot) return;

    if (spot.status === 'livre') {
      this.openCheckinModal(spot);
    } else {
      this.openCheckoutModal(spot);
    }
  },

  /* -------------------------------------------------------------------------
   * RENDERIZACAO DA TABELA DE VEICULOS ATIVOS
   * ------------------------------------------------------------------------- */
  renderTable() {
    const tbody = document.getElementById('table-active-body');
    if (!tbody) return;

    let spots = window.StorageManager.getSpots().filter(s => s.status === 'ocupada' && s.current);

    // Filtro por Secao
    if (this.activeSection !== 'all') {
      spots = spots.filter(s => s.section === this.activeSection);
    }

    // Filtro por Busca
    if (this.searchTerm) {
      spots = spots.filter(s => {
        const spotNum = s.number.toUpperCase();
        const plate = s.current.plate.toUpperCase();
        const client = (s.current.clientName || '').toUpperCase();
        return spotNum.includes(this.searchTerm) || plate.includes(this.searchTerm) || client.includes(this.searchTerm);
      });
    }

    if (spots.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-slate-500 text-xs">
            Nenhum veiculo estacionado para a secao/busca selecionada.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = spots.map(s => {
      const c = s.current;
      const diffMs = Date.now() - new Date(c.entryTime).getTime();
      const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const duration = `${h}h ${m.toString().padStart(2, '0')}m`;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
          <td class="py-2.5 px-3 font-mono font-bold text-slate-900">${s.number}</td>
          <td class="py-2.5 px-3">
            <span class="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
              ${c.plate}
            </span>
          </td>
          <td class="py-2.5 px-3 text-slate-700">${c.clientName || 'Cliente Avulso'}</td>
          <td class="py-2.5 px-3 text-slate-500">${s.sectionLabel}</td>
          <td class="py-2.5 px-3 text-slate-600">${new Date(c.entryTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
          <td class="py-2.5 px-3 font-bold text-red-700">${duration}</td>
          <td class="py-2.5 px-3 text-right">
            <button onclick="App.handleSpotClick('${s.id}')"
                    class="px-3 py-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition">
              Cobrar Saida
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* -------------------------------------------------------------------------
   * RENDERIZACAO DO HISTORICO
   * ------------------------------------------------------------------------- */
  renderHistory() {
    const tbody = document.getElementById('table-history-body');
    if (!tbody) return;

    let history = window.StorageManager.getHistory();

    if (this.searchTerm) {
      history = history.filter(h => {
        const plate = (h.plate || '').toUpperCase();
        const client = (h.clientName || '').toUpperCase();
        const spot = (h.spotNumber || '').toUpperCase();
        return plate.includes(this.searchTerm) || client.includes(this.searchTerm) || spot.includes(this.searchTerm);
      });
    }

    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-slate-500 text-xs">
            Nenhum registro localizado no historico.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = history.map(h => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
        <td class="py-2 px-3 font-mono text-slate-400">${h.ticketId}</td>
        <td class="py-2 px-3 font-mono font-bold text-slate-900">${h.plate}</td>
        <td class="py-2 px-3 text-slate-700">${h.clientName}</td>
        <td class="py-2 px-3 font-mono font-medium">${h.spotNumber}</td>
        <td class="py-2 px-3 text-slate-600">${h.duration}</td>
        <td class="py-2 px-3 font-bold text-emerald-800">R$ ${h.amount.toFixed(2).replace('.', ',')}</td>
        <td class="py-2 px-3 text-slate-500">${h.paymentMethod}</td>
      </tr>
    `).join('');
  },

  /* -------------------------------------------------------------------------
   * ENTRADA (CHECK-IN)
   * ------------------------------------------------------------------------- */
  openCheckinModal(preselectedSpot = null) {
    this.selectedSpot = preselectedSpot;
    const form = document.getElementById('form-checkin');
    form.reset();

    const select = document.getElementById('checkin-spot-id');
    const freeSpots = window.StorageManager.getSpots().filter(s => s.status === 'livre');

    if (freeSpots.length === 0) {
      alert('O estacionamento esta lotado no momento.');
      return;
    }

    select.innerHTML = freeSpots.map(s => `
      <option value="${s.id}" ${preselectedSpot && preselectedSpot.id === s.id ? 'selected' : ''}>
        Vaga ${s.number} (${s.sectionLabel})
      </option>
    `).join('');

    document.getElementById('modal-checkin').classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('checkin-plate').focus();
    }, 100);
  },

  submitCheckin() {
    const spotId = document.getElementById('checkin-spot-id').value;
    const plate = document.getElementById('checkin-plate').value.trim().toUpperCase();
    const clientName = document.getElementById('checkin-client').value.trim() || 'Cliente Avulso';

    if (!spotId) {
      alert('Selecione uma vaga disponivel.');
      return;
    }

    if (!plate || plate.length < 5) {
      alert('Informe uma placa valida.');
      return;
    }

    const spots = window.StorageManager.getSpots();
    const spot = spots.find(s => s.id === spotId);
    if (!spot || spot.status !== 'livre') {
      alert('A vaga selecionada nao esta disponivel.');
      return;
    }

    const ticketId = 'TCK-' + Math.floor(100 + Math.random() * 900);

    spot.status = 'ocupada';
    spot.current = {
      ticketId,
      plate,
      clientName,
      section: spot.section,
      spotNumber: spot.number,
      entryTime: new Date().toISOString(),
    };

    window.StorageManager.saveSpots(spots);
    document.getElementById('modal-checkin').classList.add('hidden');
    this.render();
  },

  /* -------------------------------------------------------------------------
   * SAIDA (CHECK-OUT E CALCULO DIRETO NO FRONTEND)
   * ------------------------------------------------------------------------- */
  openCheckoutModal(spot) {
    if (!spot || !spot.current) return;
    this.selectedSpot = spot;

    const current = spot.current;
    const exitTime = new Date();

    // Calculo da tarifa diretamente no frontend
    const feeData = window.TariffModule.calculateParkingFee(current.entryTime, exitTime);

    document.getElementById('checkout-ticket').textContent = current.ticketId;
    document.getElementById('checkout-plate').textContent = current.plate;
    document.getElementById('checkout-spot').textContent = `${spot.number} (${spot.sectionLabel})`;
    document.getElementById('checkout-client').textContent = current.clientName || 'Cliente Avulso';
    document.getElementById('checkout-entry').textContent = new Date(current.entryTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('checkout-exit').textContent = exitTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('checkout-duration').textContent = feeData.formattedDuration;
    document.getElementById('checkout-rule').textContent = feeData.description;
    document.getElementById('checkout-total').textContent = feeData.formattedAmount;

    this.activeCheckoutCalc = {
      spotId: spot.id,
      ticketId: current.ticketId,
      plate: current.plate,
      clientName: current.clientName || 'Cliente Avulso',
      spotNumber: spot.number,
      section: spot.section,
      entryTime: current.entryTime,
      exitTime: exitTime.toISOString(),
      duration: feeData.formattedDuration,
      amount: feeData.amount,
    };

    document.getElementById('modal-checkout').classList.remove('hidden');
  },

  submitCheckout() {
    if (!this.activeCheckoutCalc) return;

    const calc = this.activeCheckoutCalc;
    const paymentMethod = document.getElementById('checkout-payment').value;

    // Libera a vaga
    const spots = window.StorageManager.getSpots();
    const spot = spots.find(s => s.id === calc.spotId);
    if (spot) {
      spot.status = 'livre';
      spot.current = null;
      window.StorageManager.saveSpots(spots);
    }

    // Grava no historico
    const history = window.StorageManager.getHistory();
    history.unshift({
      ticketId: calc.ticketId,
      plate: calc.plate,
      clientName: calc.clientName,
      spotNumber: calc.spotNumber,
      section: calc.section,
      entryTime: calc.entryTime,
      exitTime: calc.exitTime,
      duration: calc.duration,
      amount: calc.amount,
      paymentMethod,
    });
    window.StorageManager.saveHistory(history);

    // Fecha modal e atualiza tela
    document.getElementById('modal-checkout').classList.add('hidden');
    this.render();
  },

  startClock() {
    const el = document.getElementById('system-clock');
    if (!el) return;
    const tick = () => {
      const now = new Date();
      el.textContent = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    };
    tick();
    this.clockTimer = setInterval(tick, 1000);
  }
};

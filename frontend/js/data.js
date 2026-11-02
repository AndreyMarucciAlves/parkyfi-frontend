/**
 * Camada de Dados e Persistencia Local (LocalStorage)
 * Estrutura simplificada focada na operacao: Placa, Secao e Vaga.
 */

const STORAGE_KEY_SPOTS = 'park_system_spots_v2';
const STORAGE_KEY_HISTORY = 'park_system_history_v2';
const STORAGE_KEY_USERS = 'park_system_users_v2';
const STORAGE_KEY_SESSION = 'park_system_session_v2';

function createInitialSpots() {
  const spots = [];
  const sections = ['A', 'B', 'C'];
  const sectionLabels = {
    A: 'Secao A - Terreo',
    B: 'Secao B - Subsolo',
    C: 'Secao C - Patio Externo',
  };

  sections.forEach(sec => {
    for (let i = 1; i <= 8; i++) {
      const numStr = i.toString().padStart(2, '0');
      const spotId = `${sec}-${numStr}`;
      spots.push({
        id: spotId,
        section: sec,
        sectionLabel: sectionLabels[sec],
        number: spotId,
        status: 'livre',
        current: null,
      });
    }
  });

  // Dois veiculos de exemplo para teste imediato
  const now = Date.now();

  // Vaga A-02 ocupada ha 45 minutos
  spots[1].status = 'ocupada';
  spots[1].current = {
    ticketId: 'TCK-201',
    plate: 'BRA2E19',
    clientName: 'Carlos Mendes',
    section: 'A',
    spotNumber: 'A-02',
    entryTime: new Date(now - 45 * 60 * 1000).toISOString(),
  };

  // Vaga B-03 ocupada ha 2 horas e 15 minutos
  spots[10].status = 'ocupada';
  spots[10].current = {
    ticketId: 'TCK-202',
    plate: 'RQN4H88',
    clientName: 'Mariana Silva',
    section: 'B',
    spotNumber: 'B-03',
    entryTime: new Date(now - 135 * 60 * 1000).toISOString(),
  };

  return spots;
}

const DEFAULT_USERS = [
  {
    id: 'usr-1',
    name: 'Administrador',
    email: 'admin@estacionamento.com',
    password: 'admin',
    role: 'Administrador',
  },
  {
    id: 'usr-2',
    name: 'Operador de Patio',
    email: 'operador@estacionamento.com',
    password: 'operador',
    role: 'Operador',
  },
];

const DEFAULT_HISTORY = [
  {
    ticketId: 'TCK-199',
    plate: 'KLU9A11',
    clientName: 'Fernando Ramos',
    section: 'A',
    spotNumber: 'A-01',
    entryTime: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    duration: '2h 00min',
    amount: 15.00,
    paymentMethod: 'Pix',
  },
  {
    ticketId: 'TCK-200',
    plate: 'FTY4J90',
    clientName: 'Aline Souza',
    section: 'C',
    spotNumber: 'C-04',
    entryTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    duration: '12min',
    amount: 0.00,
    paymentMethod: 'Tolerancia',
  },
];

class StorageManager {
  static getSpots() {
    const raw = localStorage.getItem(STORAGE_KEY_SPOTS);
    if (!raw) {
      const initial = createInitialSpots();
      this.saveSpots(initial);
      return initial;
    }
    return JSON.parse(raw);
  }

  static saveSpots(spots) {
    localStorage.setItem(STORAGE_KEY_SPOTS, JSON.stringify(spots));
  }

  static getHistory() {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) {
      this.saveHistory(DEFAULT_HISTORY);
      return DEFAULT_HISTORY;
    }
    return JSON.parse(raw);
  }

  static saveHistory(history) {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }

  static getUsers() {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      this.saveUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  }

  static saveUsers(users) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  static getSession() {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    return raw ? JSON.parse(raw) : null;
  }

  static saveSession(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  }
}

window.StorageManager = StorageManager;

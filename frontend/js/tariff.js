/**
 * Motor de Calculo de Tarifa - 100% no Frontend
 * 
 * Regra Operacional Simplificada:
 * - Ate 15 minutos: Tolerancia gratuita (R$ 0,00)
 * - Primeira hora (ate 60 min): R$ 10,00
 * - Horas adicionais: R$ 5,00 por hora (ou fracao proporcional)
 * - Teto de Diaria (a partir de 6 horas): R$ 40,00
 */

const TARIFF_CONFIG = {
  toleranceMinutes: 15,
  firstHourRate: 10.00,
  additionalHourRate: 5.00,
  dailyRate: 40.00,
};

function calculateParkingFee(entryTime, exitTime = new Date()) {
  const start = new Date(entryTime);
  const end = new Date(exitTime);

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedDuration = `${hours}h ${minutes.toString().padStart(2, '0')}min`;

  // 1. Tolerancia inicial
  if (totalMinutes <= TARIFF_CONFIG.toleranceMinutes) {
    return {
      totalMinutes,
      formattedDuration,
      isTolerance: true,
      description: `Tolerancia gratuita (ate ${TARIFF_CONFIG.toleranceMinutes} min)`,
      amount: 0.00,
      formattedAmount: 'R$ 0,00',
    };
  }

  // 2. Ate 1 hora
  if (totalMinutes <= 60) {
    return {
      totalMinutes,
      formattedDuration,
      isTolerance: false,
      description: 'Primeira hora integral',
      amount: TARIFF_CONFIG.firstHourRate,
      formattedAmount: `R$ ${TARIFF_CONFIG.firstHourRate.toFixed(2).replace('.', ',')}`,
    };
  }

  // 3. Mais de 1 hora
  const extraMinutes = totalMinutes - 60;
  const extraHours = Math.ceil(extraMinutes / 60);
  const subtotal = TARIFF_CONFIG.firstHourRate + (extraHours * TARIFF_CONFIG.additionalHourRate);

  // Aplica teto da diaria
  if (subtotal >= TARIFF_CONFIG.dailyRate) {
    return {
      totalMinutes,
      formattedDuration,
      isTolerance: false,
      description: 'Teto de diaria aplicado',
      amount: TARIFF_CONFIG.dailyRate,
      formattedAmount: `R$ ${TARIFF_CONFIG.dailyRate.toFixed(2).replace('.', ',')}`,
    };
  }

  return {
    totalMinutes,
    formattedDuration,
    isTolerance: false,
    description: `1ª hora (R$ ${TARIFF_CONFIG.firstHourRate.toFixed(2)}) + ${extraHours}h adicionais`,
    amount: subtotal,
    formattedAmount: `R$ ${subtotal.toFixed(2).replace('.', ',')}`,
  };
}

window.TariffModule = {
  TARIFF_CONFIG,
  calculateParkingFee,
};

/**
 * ============================================================
 * MODELO MATEMATICO DE OCUPACION HOSPITALARIA
 * ============================================================
 *
 * MODELO BASE: Ecuacion diferencial de flujo de pacientes
 * -------------------------------------------------------
 * El sistema se modela como un proceso dinamico de primer orden
 * con termino no lineal tipo Bernoulli:
 *
 *   dP/dt = lambda(t) - mu(t)*P(t) - gamma*P(t)^2/C
 *
 * Donde:
 *   P(t)   = numero de pacientes en tiempo t
 *   lambda = tasa de ingresos (admisiones/hora)
 *   mu     = tasa de altas por paciente (1/estadia_media)
 *   C      = capacidad maxima del hospital
 *   gamma  = factor de saturacion no lineal (Bernoulli)
 *
 * LINEALIZACION (para aplicar Transformada de Laplace):
 * ---------------------------------------------------
 * Linealizamos alrededor del punto de equilibrio P_eq:
 *
 *   P_eq = lambda / mu
 *
 * Sea p(t) = P(t) - P_eq  (perturbacion alrededor del equilibrio)
 *
 *   dp/dt = -(mu + 2*gamma*P_eq/C) * p(t) + delta_lambda(t)
 *
 * Forma estandar: dp/dt + alpha*p = delta_lambda(t)
 *   donde alpha = mu + 2*gamma*P_eq/C
 *
 * TRANSFORMADA DE LAPLACE:
 * ------------------------
 * Aplicando L{} con condicion inicial p(0)=p0:
 *
 *   s*P(s) - p0 + alpha*P(s) = DeltaLambda(s)
 *   P(s) = p0/(s + alpha) + DeltaLambda(s)/(s + alpha)
 *
 * Para entrada escalon DeltaLambda(s) = delta_lambda/s:
 *   P(s) = p0/(s+alpha) + delta_lambda/[s*(s+alpha)]
 *
 * Antitransformando (fracciones parciales):
 *   p(t) = p0*exp(-alpha*t) + (delta_lambda/alpha)*(1 - exp(-alpha*t))
 *
 * Constante de tiempo del sistema: tau = 1/alpha = 1/(mu + 2*gamma*P_eq/C)
 *
 * METODO NUMERICO: Euler Mejorado (Metodo de Heun)
 * ------------------------------------------------
 * Para integrar la ODE no lineal completa se usa el metodo
 * predictor-corrector de Heun, identico al utilizado en los
 * ejercicios de clase:
 *
 *   PASO 1 - Predictor (Euler simple):
 *     y* = P(t) + h * f(t, P(t))
 *
 *   PASO 2 - Corrector (promedio de pendientes):
 *     P(t+h) = P(t) + (h/2) * [f(t, P(t)) + f(t+h, y*)]
 *
 *   yk+1 = yk + (h/2) * [f(xk, yk) + f(xk+1, y*)]
 *
 * Error local O(h^3), error global O(h^2)
 * ============================================================
 */

export interface ModelParams {
  /** Numero actual de pacientes */
  currentPatients: number;
  /** Ingresos promedio por dia */
  dailyAdmissions: number;
  /** Altas promedio por dia */
  dailyDischarges: number;
  /** Capacidad maxima del hospital (default: 200) */
  capacity?: number;
}

export interface SimulationPoint {
  /** Tiempo en horas */
  time: number;
  /** Numero de pacientes */
  patients: number;
  /** Porcentaje de ocupacion 0-100 */
  occupancyRate: number;
  /** Estado del sistema */
  status: OccupancyStatus;
}

export type OccupancyStatus = 'normal' | 'alto' | 'saturado' | 'colapso';

export interface SimulationResult {
  points: SimulationPoint[];
  finalOccupancy: number;
  status: OccupancyStatus;
  peakOccupancy: number;
  peakTime: number;
  timeConstant: number; // tau del sistema en horas
  alert: string | null;
}

// Constantes del modelo
const DEFAULT_CAPACITY = 200;
const HOURS_PER_DAY = 24;
// Factor de no linealidad tipo Bernoulli (gamma)
const NONLINEAR_FACTOR = 0.15;
// Paso de integracion en horas
const EULER_STEP = 0.5;

/**
 * ODE del sistema: f(t, P) = lambda - mu*P - gamma*P^2/C
 * El guion bajo en _t indica que t no se usa directamente
 * (el sistema es autonomo en este modelo).
 */
function systemODE(
  _t: number,
  P: number,
  lambda: number,
  mu: number,
  capacity: number
): number {
  const saturacion = (NONLINEAR_FACTOR * P * P) / capacity;
  return lambda - mu * P - saturacion;
}

/**
 * Un paso de Euler Mejorado (Metodo de Heun).
 *
 * Igual al metodo de clase:
 *   yk+1 = yk + (h/2) * [f(xk, yk) + f(xk+1, y*)]
 * donde y* = yk + h * f(xk, yk)  (predictor Euler simple)
 */
function eulerMejoradoStep(
  t: number,
  P: number,
  h: number,
  lambda: number,
  mu: number,
  capacity: number
): number {
  // Pendiente en el punto actual
  const fk = systemODE(t, P, lambda, mu, capacity);
  // Predictor: Euler simple
  const y_pred = P + h * fk;
  // Pendiente en el punto predicho
  const f_pred = systemODE(t + h, y_pred, lambda, mu, capacity);
  // Corrector: promedio de las dos pendientes
  return P + (h / 2) * (fk + f_pred);
}

/** Clasifica el estado segun el porcentaje de ocupacion */
function classifyStatus(occupancyRate: number): OccupancyStatus {
  if (occupancyRate < 75) return 'normal';
  if (occupancyRate < 85) return 'alto';
  if (occupancyRate < 95) return 'saturado';
  return 'colapso';
}

/**
 * Calcula la constante de tiempo del sistema usando el analisis de Laplace.
 * tau = 1 / alpha = 1 / (mu + 2*gamma*P_eq/C)
 * Representa cuanto tarda el sistema en responder a cambios.
 */
function computeTimeConstant(
  lambda: number,
  mu: number,
  capacity: number
): number {
  const pEq = mu > 0 ? Math.min(lambda / mu, capacity) : capacity * 0.5;
  const alpha = mu + (2 * NONLINEAR_FACTOR * pEq) / capacity;
  return alpha > 0 ? 1 / alpha : 999;
}

/** Genera el mensaje de alerta segun el estado proyectado */
function generateAlert(
  status: OccupancyStatus,
  peakOccupancy: number,
  peakTime: number
): string | null {
  if (status === 'normal') return null;
  const horas = peakTime.toFixed(0);
  if (status === 'alto')
    return `Ocupacion elevada esperada (~${peakOccupancy.toFixed(0)}%) en aprox. ${horas}h. Considere preparar recursos adicionales.`;
  if (status === 'saturado')
    return `Atencion: SATURACION PROYECTADA (~${peakOccupancy.toFixed(0)}%) en ${horas}h. Active protocolos de contingencia.`;
  return `ALERTA CRITICA: COLAPSO PROYECTADO (~${peakOccupancy.toFixed(0)}%) en ${horas}h. Accion inmediata requerida.`;
}

/**
 * Funcion principal de simulacion.
 * Convierte los inputs del usuario en parametros del modelo y
 * ejecuta la integracion por Euler Mejorado (Heun) para el
 * horizonte solicitado. La solucion analitica via Laplace se
 * usa unicamente para calcular la constante de tiempo tau.
 *
 * @param params       Parametros del usuario
 * @param horizonHours Horizonte de simulacion en horas (0, 24, 48, 72)
 */
export function runSimulation(
  params: ModelParams,
  horizonHours: number
): SimulationResult {
  const capacity = params.capacity ?? DEFAULT_CAPACITY;

  // Convertir inputs diarios a tasas horarias
  const lambda = params.dailyAdmissions / HOURS_PER_DAY; // ingresos/hora
  const mu = params.dailyDischarges / (HOURS_PER_DAY * Math.max(params.currentPatients, 1));

  // Calcular constante de tiempo via analisis de Laplace
  const timeConstant = computeTimeConstant(lambda, mu, capacity);

  // Si el horizonte es 0: resultado instantaneo sin simulacion
  if (horizonHours === 0) {
    const occ = Math.min((params.currentPatients / capacity) * 100, 100);
    const status = classifyStatus(occ);
    const point: SimulationPoint = {
      time: 0,
      patients: params.currentPatients,
      occupancyRate: occ,
      status,
    };
    return {
      points: [point],
      finalOccupancy: occ,
      status,
      peakOccupancy: occ,
      peakTime: 0,
      timeConstant,
      alert: generateAlert(status, occ, 0),
    };
  }

  // Integracion por Euler Mejorado para el horizonte completo
  const points: SimulationPoint[] = [];
  let P = Math.max(0, params.currentPatients);
  let t = 0;
  let peakOccupancy = 0;
  let peakTime = 0;

  // Registrar punto inicial
  const initOcc = Math.min((P / capacity) * 100, 100);
  points.push({
    time: 0,
    patients: P,
    occupancyRate: initOcc,
    status: classifyStatus(initOcc),
  });
  if (initOcc > peakOccupancy) { peakOccupancy = initOcc; peakTime = 0; }

  // Intervalo de guardado de puntos para la grafica
  const recordInterval = horizonHours <= 24 ? 1 : horizonHours <= 48 ? 2 : 3;
  let nextRecord = recordInterval;

  while (t < horizonHours) {
    const h = Math.min(EULER_STEP, horizonHours - t);
    P = eulerMejoradoStep(t, P, h, lambda, mu, capacity);
    // Limites fisicos: no negativo, no mas de 110% de capacidad
    P = Math.max(0, Math.min(P, capacity * 1.1));
    t += h;

    if (t >= nextRecord - 0.001 || Math.abs(t - horizonHours) < 0.001) {
      const occ = Math.min((P / capacity) * 100, 100);
      const status = classifyStatus(occ);
      points.push({
        time: parseFloat(t.toFixed(1)),
        patients: parseFloat(P.toFixed(1)),
        occupancyRate: parseFloat(occ.toFixed(2)),
        status,
      });
      if (occ > peakOccupancy) { peakOccupancy = occ; peakTime = t; }
      nextRecord += recordInterval;
    }
  }

  const lastPoint = points[points.length - 1];
  const worstStatus = classifyStatus(peakOccupancy);

  return {
    points,
    finalOccupancy: lastPoint.occupancyRate,
    status: worstStatus,
    peakOccupancy,
    peakTime,
    timeConstant,
    alert: generateAlert(worstStatus, peakOccupancy, peakTime),
  };
}

// Utilidades de presentacion
export function statusLabel(status: OccupancyStatus): string {
  const map: Record<OccupancyStatus, string> = {
    normal:   'Normal',
    alto:     'Nivel Alto',
    saturado: 'Saturado',
    colapso:  'Colapso Critico',
  };
  return map[status];
}

export function statusColor(status: OccupancyStatus): string {
  const map: Record<OccupancyStatus, string> = {
    normal:   '#10b981',
    alto:     '#f59e0b',
    saturado: '#f97316',
    colapso:  '#ef4444',
  };
  return map[status];
}
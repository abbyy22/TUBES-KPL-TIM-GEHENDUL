const OrderStateMachine = (() => {
  const STATES = {
    IDLE: "IDLE",
    ORDERED: "ORDERED",
    COOKING: "COOKING",
    READY: "READY",
    DONE: "DONE",
  };

  const STEPS = [STATES.ORDERED, STATES.COOKING, STATES.READY, STATES.DONE];

  const LABELS = {
    ORDERED: "Dipesan",
    COOKING: "Dimasak",
    READY: "Siap Diambil",
    DONE: "Selesai",
  };

  const TRANSITIONS = {
    IDLE: [STATES.ORDERED],
    ORDERED: [STATES.COOKING],
    COOKING: [STATES.READY],
    READY: [STATES.DONE],
    DONE: [],
  };

  let currentState = STATES.IDLE;
  // Menyimpan orderId aktif milik pelanggan ini
  let activeOrderId = null;

  function transition(toState) {
    if (!canTransition(toState)) return false;
    currentState = toState;
    return true;
  }

  /**
   * forceState – dipakai oleh socket.io event handler di index.html
   * untuk langsung set state tanpa validasi transisi.
   * Contoh: server bilang READY, kita paksa set ke READY.
   */
  function forceState(state) {
    if (Object.values(STATES).includes(state)) {
      currentState = state;
      return true;
    }
    return false;
  }

  function getState() {
    return currentState;
  }

  function reset() {
    currentState = STATES.IDLE;
    activeOrderId = null;
  }

  function setActiveOrderId(id) {
    activeOrderId = id;
  }

  function getActiveOrderId() {
    return activeOrderId;
  }

  function getSteps() {
    return STEPS;
  }

  function getLabels() {
    return LABELS;
  }

  function canTransition(toState) {
    return (TRANSITIONS[currentState] || []).includes(toState);
  }

  function getStepStatus(step) {
    const steps = getSteps();
    const currentIndex = steps.indexOf(currentState);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "inactive";
  }

  return {
    STATES,
    transition,
    forceState,
    reset,
    getState,
    setActiveOrderId,
    getActiveOrderId,
    canTransition,
    getSteps,
    getLabels,
    getStepStatus,
  };
})();

window.OrderStateMachine = OrderStateMachine;

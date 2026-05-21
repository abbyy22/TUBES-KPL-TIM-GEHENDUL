const OrderStateMachine = (() => {

    const STATES = {
        IDLE: 'IDLE',
        ORDERED: 'ORDERED',
        COOKING: 'COOKING',
        READY: 'READY',
        DONE: 'DONE',
    };

    const STEPS = [
        STATES.ORDERED,
        STATES.COOKING,
        STATES.READY,
        STATES.DONE,
    ];

    const LABELS = {
        ORDERED: 'Dipesan',
        COOKING: 'Dimasak',
        READY: 'Siap Diambil',
        DONE: 'Selesai',
    };

    const TRANSITIONS = {
        IDLE: [STATES.ORDERED],
        ORDERED: [STATES.COOKING],
        COOKING: [STATES.READY],
        READY: [STATES.DONE],
        DONE: [],
    };

    let currentState = STATES.IDLE;

    function transition(toState) {
        if (!canTransition(toState)) return false;
        currentState = toState;
        return true;
    }

    function getState() {
        return currentState;
    }

    function reset() {
        currentState = STATES.IDLE;
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

        const currentIndex =
            steps.indexOf(currentState);

        const stepIndex =
            steps.indexOf(step);

        if (stepIndex < currentIndex) {
            return 'done';
        }

        if (stepIndex === currentIndex) {
            return 'active';
        }

        return 'inactive';
    }

    return {
        STATES,
        transition,
        reset,
        getState,
        canTransition,
        getSteps,
        getLabels,
        getStepStatus,
    };

})();

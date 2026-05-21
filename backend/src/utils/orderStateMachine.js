'use strict';

/**
 * Order state machine (Automata).
 * States: ORDERED -> COOKING -> READY -> DONE
 *
 * Sesuai README:
 *   "Update status pesanan: ORDERED -> COOKING -> READY -> DONE"
 */
const STATES = Object.freeze({
  ORDERED: 'ORDERED',
  COOKING: 'COOKING',
  READY: 'READY',
  DONE: 'DONE',
});

const TRANSITIONS = Object.freeze({
  ORDERED: ['COOKING'],
  COOKING: ['READY'],
  READY: ['DONE'],
  DONE: [],
});

function isValidState(state) {
  return Object.prototype.hasOwnProperty.call(TRANSITIONS, state);
}

function canTransition(from, to) {
  if (!isValidState(from) || !isValidState(to)) return false;
  return TRANSITIONS[from].includes(to);
}

function nextStates(from) {
  if (!isValidState(from)) return [];
  return [...TRANSITIONS[from]];
}

module.exports = {
  STATES,
  TRANSITIONS,
  isValidState,
  canTransition,
  nextStates,
};

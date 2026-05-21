'use strict';

const assert = require('assert/strict');
const {
  validateRegister,
  validateOrderInput,
} = require('../src/validators');
const {
  STATES,
  canTransition,
} = require('../src/utils/orderStateMachine');

// ── Register validator tests ──────────────────────────────────────────────────

// Valid registration with full_name (new Joi field)
const registered = validateRegister({
  full_name: 'Siswa Test',
  email: 'SISWA@TELFOOD.TEST',
  password: 'password123',
});

// Role should always be 'user' (changed from 'pelanggan')
assert.equal(registered.role, 'user', `expected role 'user', got '${registered.role}'`);
// Email should be lowercased
assert.equal(registered.email, 'siswa@telfood.test');
// name should be mapped from full_name
assert.equal(registered.name, 'Siswa Test');

// Sending 'role' field should be rejected (forbidden in Joi schema)
assert.throws(() => validateRegister({
  full_name: 'Admin Jahat',
  email: 'admin-baru@telfood.test',
  password: 'password123',
  role: 'admin',
}), /register publik/);

// Missing full_name should throw
assert.throws(() => validateRegister({
  email: 'test@test.com',
  password: 'password123',
}), /full_name wajib diisi/);

// Short password should throw
assert.throws(() => validateRegister({
  full_name: 'Bagas',
  email: 'bagas@test.com',
  password: '12345',
}), /password minimal 6 karakter/);

// ── Order validator tests ─────────────────────────────────────────────────────

const order = validateOrderInput({
  kantin_id: 1,
  customer_name: 'Mimae',
  items: [{ menu_id: 2, quantity: 3 }],
});

assert.equal(order.kantin_id, 1);
assert.equal(order.items[0].quantity, 3);

// ── State machine tests ───────────────────────────────────────────────────────

assert.equal(canTransition(STATES.ORDERED, STATES.COOKING), true);
assert.equal(canTransition(STATES.ORDERED, STATES.READY), false);
assert.equal(canTransition(STATES.DONE, STATES.ORDERED), false);

console.log('✅ All backend validator/state-machine tests passed');

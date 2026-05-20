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

const registered = validateRegister({
  name: 'Siswa Test',
  email: 'SISWA@TELFOOD.TEST',
  password: 'password123',
});

assert.equal(registered.role, 'pelanggan');
assert.equal(registered.email, 'siswa@telfood.test');

assert.throws(() => validateRegister({
  name: 'Admin Jahat',
  email: 'admin-baru@telfood.test',
  password: 'password123',
  role: 'admin',
}), /register publik/);

const order = validateOrderInput({
  kantin_id: 1,
  customer_name: 'Mimae',
  items: [{ menu_id: 2, quantity: 3 }],
});

assert.equal(order.kantin_id, 1);
assert.equal(order.items[0].quantity, 3);

assert.equal(canTransition(STATES.ORDERED, STATES.COOKING), true);
assert.equal(canTransition(STATES.ORDERED, STATES.READY), false);
assert.equal(canTransition(STATES.DONE, STATES.ORDERED), false);

console.log('backend validator/state-machine tests passed');

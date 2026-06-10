/**
 * Table-driven construction.
 * Semua label dan style status dikendalikan oleh tabel konfigurasi ini,
 * bukan if-else/switch berulang di banyak file.
 */
const ORDER_STATUS_META = Object.freeze({
  ORDERED: {
    label: 'Dipesan',
    color: '#C05A1F',
    notification: 'Pesanan kamu sudah diterima oleh kantin.',
  },
  COOKING: {
    label: 'Dimasak',
    color: '#EA580C',
    notification: 'Pesanan kamu sedang dimasak.',
  },
  READY: {
    label: 'Siap Diambil',
    color: '#16A34A',
    notification: 'Pesanan kamu sudah siap diambil.',
  },
  DONE: {
    label: 'Selesai',
    color: '#64748B',
    notification: 'Pesanan kamu sudah selesai.',
  },
});

function getOrderStatusMeta(status) {
  return ORDER_STATUS_META[status] || {
    label: status || 'Tidak diketahui',
    color: '#64748B',
    notification: 'Ada pembaruan pada pesanan kamu.',
  };
}

window.ORDER_STATUS_META = ORDER_STATUS_META;
window.getOrderStatusMeta = getOrderStatusMeta;

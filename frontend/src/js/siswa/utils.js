const Utils = (() => {

  function formatRupiah(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'Rp 0';
    }

    return 'Rp ' + amount.toLocaleString('id-ID');
  }

  function sanitize(str) {
    if (typeof str !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = str;

    return div.innerHTML;
  }

  function generateOrderId() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  function validateNama(nama) {
    if (!nama || nama.trim() === '') {
      return {
        valid: false,
        message: 'Nama tidak boleh kosong'
      };
    }

    return {
      valid: true,
      message: ''
    };
  }

  return {
    formatRupiah,
    sanitize,
    generateOrderId,
    validateNama
  };

})();
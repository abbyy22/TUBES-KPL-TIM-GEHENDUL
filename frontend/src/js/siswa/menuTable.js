const MenuTable = (() => {

  const KANTIN_LIST = [
    { id: 'neo1', name: 'Kantin NEO 1' },
    { id: 'neo2', name: 'Kantin NEO 2' },
    { id: 'tpb', name: 'Kantin TPB' },
    { id: 'gkm', name: 'Kantin GKM' },
  ];

  const MENU_DATA = {
    neo1: [
      { id: 'm1', name: 'Nasi Goreng Maza', price: 15000, emoji: '🍳', kantin: 'Kantin NEO 1' },
      { id: 'm2', name: 'Es Teh Manis', price: 3000, emoji: '🍹', kantin: 'Kantin NEO 1' },
    ],

    neo2: [
      { id: 'm3', name: 'Bakso Urat', price: 14000, emoji: '🍜', kantin: 'Kantin NEO 2' },
      { id: 'm4', name: 'Jus Alpukat', price: 8000, emoji: '🥑', kantin: 'Kantin NEO 2' },
    ],

    tpb: [
      { id: 'm5', name: 'Ayam Geprek', price: 13000, emoji: '🍗', kantin: 'Kantin TPB' },
    ],

    gkm: [
      { id: 'm6', name: 'Mie Ayam', price: 12000, emoji: '🍜', kantin: 'Kantin GKM' },
    ],
  };

  const TOP_MENU = [
    {
      rank: 1,
      name: 'Nasi Goreng Maza',
      kantin: 'Kantin NEO 1',
    },
    {
      rank: 2,
      name: 'Bakso Urat',
      kantin: 'Kantin NEO 2',
    },
    {
      rank: 3,
      name: 'Ayam Geprek',
      kantin: 'Kantin TPB',
    },
  ];

  function getTopMenu() {
    return [...TOP_MENU];
  }

  function getKantinList() {
    return [...KANTIN_LIST];
  }

  function getMenuByKantin(kantinId) {
    return MENU_DATA[kantinId] || [];
  }

  function findMenuItemById(itemId) {
    for (const kantin of Object.values(MENU_DATA)) {
      const found = kantin.find(item => item.id === itemId);

      if (found) return found;
    }

    return null;
  }

  return {
    getTopMenu,
    getKantinList,
    getMenuByKantin,
    findMenuItemById
  };

})();
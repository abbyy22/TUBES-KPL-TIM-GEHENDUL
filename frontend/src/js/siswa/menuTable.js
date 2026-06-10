const MenuTable = (() => {

  const DEFAULT_KANTIN_LIST = [
    { id: 'neo1', name: 'Kantin NEO 1' },
    { id: 'neo2', name: 'Kantin NEO 2' },
    { id: 'tpb', name: 'Kantin TPB' },
    { id: 'gkm', name: 'Kantin GKM' },
  ];

  const DEFAULT_MENU_DATA = {
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

  let kantinList = [...DEFAULT_KANTIN_LIST];
  let menuData = cloneMenuData(DEFAULT_MENU_DATA);
  let apiBacked = false;

  const TOP_MENU = [
    {
      rank: 1,
      name: 'Nasi Goreng Maza',
      kantin: 'Kantin NEO 1',
      kantin_id: 'neo1',
      menu_id: 'm1',
    },
    {
      rank: 2,
      name: 'Bakso Urat',
      kantin: 'Kantin NEO 2',
      kantin_id: 'neo2',
      menu_id: 'm3',
    },
    {
      rank: 3,
      name: 'Ayam Geprek',
      kantin: 'Kantin TPB',
      kantin_id: 'tpb',
      menu_id: 'm5',
    },
  ];

  function getTopMenu() {
    return [...TOP_MENU];
  }

  function getKantinList() {
    return [...kantinList];
  }

  function getMenuByKantin(kantinId) {
    return menuData[String(kantinId)] || [];
  }

  function findMenuItemById(itemId) {
    for (const kantin of Object.values(menuData)) {
      const found = kantin.find(item => String(item.id) === String(itemId));

      if (found) return found;
    }

    return null;
  }

  function cloneMenuData(source) {
    return Object.fromEntries(
      Object.entries(source).map(([key, items]) => [key, items.map(item => ({ ...item }))])
    );
  }

  function setApiData(kantins, menus) {
    kantinList = kantins.map(kantin => ({
      id: kantin.id,
      name: kantin.name,
    }));

    menuData = {};
    menus.forEach(menu => {
      const key = String(menu.kantin_id);
      if (!menuData[key]) menuData[key] = [];
      menuData[key].push({
        id: menu.id,
        kantin_id: menu.kantin_id,
        name: menu.name,
        price: Number(menu.price),
        emoji: menu.emoji || '🍽️',
        description: menu.description || '',
        available: menu.available !== false,
        kantin: menu.kantin_name,
      });
    });

    apiBacked = true;
  }

  async function loadFromApi() {
    if (!window.ApiClient || !ApiClient.isAuthenticated()) return false;

    try {
      const [kantins, menus] = await Promise.all([
        ApiClient.getKantins(),
        ApiClient.getMenus({ available: true }),
      ]);
      setApiData(kantins, menus);
      return true;
    } catch (err) {
      console.warn('[MenuTable] Gagal ambil menu dari API, pakai data lokal:', err.message);
      apiBacked = false;
      return false;
    }
  }

  function isApiBacked() {
    return apiBacked;
  }

  return {
    isApiBacked,
    loadFromApi,
    getTopMenu,
    getKantinList,
    getMenuByKantin,
    findMenuItemById
  };

})();

const Cart = (() => {

    let items = [];

    function addItem(menuItem) {

        const existing = items.find(
            item => item.menuItem.id === menuItem.id
        );

        if (existing) {
            existing.quantity += 1;
        } else {
            items.push({
                menuItem,
                quantity: 1
            });
        }
    }

    function removeItem(itemId) {

        const existing = items.find(
            item => item.menuItem.id === itemId
        );

        if (!existing) return;

        if (existing.quantity > 1) {
            existing.quantity -= 1;
        } else {
            items = items.filter(
                item => item.menuItem.id !== itemId
            );
        }
    }

    function getItems() {
        return items;
    }

    function getTotal() {

        return items.reduce((total, item) => {
            return total + (item.menuItem.price * item.quantity);
        }, 0);

    }

    function clearCart() {
        items = [];
    }

    function isEmpty() {
        return items.length === 0;
    }

    return {
        addItem,
        removeItem,
        getItems,
        getTotal,
        clearCart,
        isEmpty
    };

})();
function getWishlist() { return JSON.parse(localStorage.getItem('fb_wishlist') || '[]'); }
function getCart() { return JSON.parse(localStorage.getItem('fb_cart') || '[]'); }
function saveWishlist(wl) { localStorage.setItem('fb_wishlist', JSON.stringify(wl)); }
function saveCart(cart) { localStorage.setItem('fb_cart', JSON.stringify(cart)); }

function showToastWL(msg) {
    const t = document.getElementById('fb-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function updateWLBadges() {
    const wl = getWishlist();
    const cart = getCart();
    const cartTotal = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.wish-badge').forEach(el => el.textContent = wl.length);
    document.querySelectorAll('.cart-badge').forEach(el => el.textContent = cartTotal);
}

function addToCartFromWL(name, price, img) {
    const cart = getCart();
    const existing = cart.find(i => i.name === name);
    if (existing) existing.qty++;
    else cart.push({ name, price, img, qty: 1 });
    saveCart(cart);
    updateWLBadges();
    showToastWL('🛒 "' + name + '" added to cart!');
}

function removeFromWishlist(name) {
    let wl = getWishlist().filter(i => i.name !== name);
    saveWishlist(wl);
    updateWLBadges();
    renderWishlist();
    showToastWL('💔 Removed from wishlist!');
}

function addAllToCart() {
    const wl = getWishlist();
    if (wl.length === 0) return;
    const cart = getCart();
    wl.forEach(item => {
        const existing = cart.find(i => i.name === item.name);
        if (existing) existing.qty++;
        else cart.push({ name: item.name, price: item.price, img: item.img, qty: 1 });
    });
    saveCart(cart);
    updateWLBadges();
    showToastWL('🛒 All items added to cart!');
}

function clearWishlist() {
    if (!confirm('Remove all items from wishlist?')) return;
    saveWishlist([]);
    updateWLBadges();
    renderWishlist();
    showToastWL('💔 Wishlist cleared!');
}

function renderWishlist(filter) {
    let wl = getWishlist();
    const grid = document.getElementById('wl-grid');
    const empty = document.getElementById('wl-empty');
    const countText = document.getElementById('wl-count-text');
    const addAllBtn = document.getElementById('wl-add-all');

    if (filter) wl = wl.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()));

    countText.textContent = wl.length + ' item' + (wl.length !== 1 ? 's' : '') + ' saved';

    if (wl.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'flex';
        if (addAllBtn) addAllBtn.style.display = 'none';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';
    if (addAllBtn) addAllBtn.style.display = 'inline-flex';

    grid.innerHTML = wl.map(item => `
        <div class="wl-card">
            <div class="wl-card-img-wrap" onclick="openProductModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <img src="${item.img}" alt="${item.name}" class="wl-card-img">
                <div class="wl-card-overlay">
                    <span>👁 View Details</span>
                </div>
            </div>
            <button class="wl-remove-btn" onclick="removeFromWishlist('${item.name.replace(/'/g, "\\'")}')">
                <i class="fa fa-times"></i>
            </button>
            <div class="wl-card-info">
                <div class="wl-card-name">${item.name}</div>
                <div class="wl-card-price">${item.price}</div>
                <div class="wl-card-tags">
                    <span>🎂 Custom</span>
                    <span>🚚 Free Delivery</span>
                </div>
                <button class="wl-cart-btn" onclick="addToCartFromWL('${item.name.replace(/'/g, "\\'")}', '${item.price}', '${item.img}')">
                    🛒 Add to Cart
                </button>
            </div>
        </div>`).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    renderWishlist();
    updateWLBadges();

    // Search
    const searchInput = document.getElementById('wl-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderWishlist(this.value);
        });
    }

    // Cart icon click
    document.querySelector('.wl-cart-icon').addEventListener('click', function() {
        if (typeof openCartDrawer === 'function') openCartDrawer();
    });
});

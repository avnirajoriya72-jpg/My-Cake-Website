// ========== CART & WISHLIST HELPERS ==========
function getCart() { return JSON.parse(localStorage.getItem('fb_cart') || '[]'); }
function getWishlist() { return JSON.parse(localStorage.getItem('fb_wishlist') || '[]'); }
function saveCart(cart) { localStorage.setItem('fb_cart', JSON.stringify(cart)); updateBadges(); renderCartDrawer(); }
function saveWishlist(wl) { localStorage.setItem('fb_wishlist', JSON.stringify(wl)); updateBadges(); }

function updateBadges() {
    const cart = getCart();
    const wl = getWishlist();
    const cartTotal = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-badge').forEach(el => el.textContent = cartTotal);
    document.querySelectorAll('.wish-badge').forEach(el => el.textContent = wl.length);
}

function addToCart(name, price, img) {
    const cart = getCart();
    const existing = cart.find(i => i.name === name);
    if (existing) { existing.qty++; } 
    else { cart.push({ name, price, img, qty: 1 }); }
    saveCart(cart);
    showToast(`🛒 "${name}" added to cart!`);
}

function toggleWishlist(name, price, img, btn) {
    const wl = getWishlist();
    const idx = wl.findIndex(i => i.name === name);
    if (idx === -1) {
        wl.push({ name, price, img });
        btn.classList.add('wishlisted');
        btn.textContent = '♥';
        showToast(`❤️ "${name}" added to wishlist!`);
    } else {
        wl.splice(idx, 1);
        btn.classList.remove('wishlisted');
        btn.textContent = '♡';
        showToast(`💔 "${name}" removed from wishlist!`);
    }
    saveWishlist(wl);
}

function removeFromCart(name) {
    let cart = getCart();
    cart = cart.filter(i => i.name !== name);
    saveCart(cart);
}

function changeQty(name, delta) {
    const cart = getCart();
    const item = cart.find(i => i.name === name);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeFromCart(name);
        else saveCart(cart);
    }
}

function showToast(msg) {
    const t = document.getElementById('fb-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ========== CART DRAWER RENDER ==========
function renderCartDrawer() {
    const cart = getCart();
    const body = document.getElementById('cart-drawer-body');
    const total = document.getElementById('cart-total');
    if (!body) return;
    if (cart.length === 0) {
        body.innerHTML = '<p style="text-align:center;color:#999;margin-top:40px">Your cart is empty 🛒</p>';
        if (total) total.textContent = 'Rs.0';
        return;
    }
    let sum = 0;
    body.innerHTML = cart.map(item => {
        const numPrice = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        sum += numPrice * item.qty;
        return `
        <div class="cart-item">
            <img src="${item.img}" alt="${item.name}">
            <div class="cart-item-info">
                <p class="cart-item-name">${item.name}</p>
                <p class="cart-item-price">${item.price}</p>
                <div class="cart-qty">
                    <button onclick="changeQty('${item.name.replace(/'/g, "\\'")}',-1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty('${item.name.replace(/'/g, "\\'")}'  ,1)">+</button>
                </div>
            </div>
            <button class="cart-remove" onclick="removeFromCart('${item.name.replace(/'/g, "\\'")}')">&times;</button>
        </div>`;
    }).join('');
    if (total) total.textContent = 'Rs.' + sum.toLocaleString();
}

// ========== PRODUCT DETAIL PAGE (FULL SCREEN) ==========
function openProductModal(item) {
    const wl = getWishlist();
    const isWished = wl.some(w => w.name === item.name);
    let qty = 1;
    let scale = 1, tx = 0, ty = 0;
    let isDragging = false, startX, startY;

    const page = document.getElementById('product-detail-page');
    page.innerHTML = `
        <header class="header-main">
            <div class="nav-wrapper">
                <div class="logo-area">
                    <a href="Home.html"><img src="Fantasy_Logo_135x.png" class="logo-img" alt="logo"></a>
                </div>
                <div class="search-area">
                    <div class="search-bar">
                        <input type="text" placeholder="Search Products...">
                        <button class="search-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="actions-area">
                    <div class="user-auth">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <div class="auth-text">
                            <a href="#" onclick="openModal('login'); return false;">Sign In</a> <span>/</span> <a href="#" onclick="openModal('register'); return false;">Register</a>
                        </div>
                    </div>
                    <div class="icon-item">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        <span class="badge wish-badge">0</span>
                    </div>
                    <div class="icon-item pdp-cart-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        <span class="badge cart-badge">0</span>
                    </div>
                </div>
            </div>
        </header>
        <nav class="navbar navbar-dark navbar-expand-lg custom-nav">
            <div class="container-fluid px-0">
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#pdp-menu">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="pdp-menu">
                    <ul class="navbar-nav">
                        <li class="nav-item"><a class="nav-link" href="cake.html">Cake</a></li>
                        <li class="nav-item"><a class="nav-link" href="cookies.html">Cookies</a></li>
                        <li class="nav-item"><a class="nav-link" href="combos.html">Combos</a></li>
                        <li class="nav-item"><a class="nav-link" href="#">Shop By Occasion</a></li>
                        <li class="nav-item"><a class="nav-link" href="#">Wedding</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="pdp-body">
            <div class="pdp-left">
                <div class="pdp-img-container" id="pdp-img-container">
                    <img src="${item.img}" alt="${item.name}" class="pdp-main-img" id="pdp-zoom-img" draggable="false">
                    <div class="pdp-zoom-controls">
                        <button id="pdp-zoom-in" title="Zoom In">+</button>
                        <button id="pdp-zoom-out" title="Zoom Out">&minus;</button>
                        <button id="pdp-zoom-reset" title="Reset">&#8635;</button>
                    </div>
                    <div class="pdp-zoom-hint">&#128269; Scroll to zoom &bull; Drag to pan</div>
                </div>
            </div>
            <div class="pdp-right">
                <button class="pdp-back" id="pdp-back">&#8592; Back</button>
                <h1 class="pdp-name">${item.name}</h1>
                <div class="pdp-rating">⭐⭐⭐⭐⭐ <span>(128 reviews)</span></div>
                <div class="pdp-price">${item.price}</div>
                <p class="pdp-desc">Freshly baked with the finest ingredients, crafted to make your celebration truly unforgettable. Available in custom sizes and flavours.</p>
                <div class="pdp-tags">
                    <span>🎂 Custom Design</span>
                    <span>🚚 Free Delivery</span>
                    <span>✅ Fresh Baked</span>
                </div>
                <div class="pdp-qty-section">
                    <label>Quantity</label>
                    <div class="pdp-qty-row">
                        <button class="pdp-qty-btn" id="pdp-minus">&#8722;</button>
                        <span class="pdp-qty-val" id="pdp-qty-val">1</span>
                        <button class="pdp-qty-btn" id="pdp-plus">+</button>
                    </div>
                </div>
                <div class="pdp-actions">
                    <button class="pdp-cart-btn" id="pdp-add-cart">&#128722; Add to Cart</button>
                    <button class="pdp-wish-btn ${isWished ? 'wishlisted' : ''}" id="pdp-wish-btn">${isWished ? '&#9829; Wishlisted' : '&#9825; Wishlist'}</button>
                </div>
                <div class="pdp-info-box">
                    <div>🕐 Order by 6PM for same-day delivery</div>
                    <div>📦 Eco-friendly packaging</div>
                    <div>💯 100% satisfaction guaranteed</div>
                </div>
            </div>
        </div>`;

    page.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Cart icon inside pdp
    page.querySelector('.pdp-cart-icon').addEventListener('click', openCartDrawer);
    updateBadges();

    const img = document.getElementById('pdp-zoom-img');
    const container = document.getElementById('pdp-img-container');

    function applyTransform() {
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        container.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    }

    // Mouse wheel zoom
    container.addEventListener('wheel', function(e) {
        e.preventDefault();
        scale = Math.min(Math.max(scale + (e.deltaY < 0 ? 0.15 : -0.15), 1), 4);
        if (scale === 1) { tx = 0; ty = 0; }
        applyTransform();
    }, { passive: false });

    // Zoom buttons
    document.getElementById('pdp-zoom-in').addEventListener('click', function() {
        scale = Math.min(scale + 0.4, 4); applyTransform();
    });
    document.getElementById('pdp-zoom-out').addEventListener('click', function() {
        scale = Math.max(scale - 0.4, 1);
        if (scale === 1) { tx = 0; ty = 0; }
        applyTransform();
    });
    document.getElementById('pdp-zoom-reset').addEventListener('click', function() {
        scale = 1; tx = 0; ty = 0; applyTransform();
    });

    // Mouse drag to pan
    container.addEventListener('mousedown', function(e) {
        if (scale <= 1) return;
        isDragging = true;
        startX = e.clientX - tx;
        startY = e.clientY - ty;
        container.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        tx = e.clientX - startX;
        ty = e.clientY - startY;
        applyTransform();
    });
    window.addEventListener('mouseup', function() {
        isDragging = false;
        if (scale > 1) container.style.cursor = 'grab';
    });

    // Touch pinch zoom
    let lastDist = 0;
    container.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
            lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
    }, { passive: true });
    container.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            scale = Math.min(Math.max(scale + (dist - lastDist) * 0.01, 1), 4);
            lastDist = dist;
            applyTransform();
        }
    }, { passive: false });

    // Back
    document.getElementById('pdp-back').addEventListener('click', closeProductModal);

    // Qty
    document.getElementById('pdp-minus').addEventListener('click', function() {
        if (qty > 1) { qty--; document.getElementById('pdp-qty-val').textContent = qty; }
    });
    document.getElementById('pdp-plus').addEventListener('click', function() {
        qty++; document.getElementById('pdp-qty-val').textContent = qty;
    });

    // Add to Cart
    document.getElementById('pdp-add-cart').addEventListener('click', function() {
        const cart = getCart();
        const existing = cart.find(i => i.name === item.name);
        if (existing) existing.qty += qty;
        else cart.push({ name: item.name, price: item.price, img: item.img, qty });
        saveCart(cart);
        showToast('🛒 "' + item.name + '" (x' + qty + ') added to cart!');
    });

    // Wishlist
    const wishBtn = document.getElementById('pdp-wish-btn');
    wishBtn.addEventListener('click', function() {
        const wl2 = getWishlist();
        const idx = wl2.findIndex(i => i.name === item.name);
        if (idx === -1) {
            wl2.push({ name: item.name, price: item.price, img: item.img });
            wishBtn.innerHTML = '&#9829; Wishlisted';
            wishBtn.classList.add('wishlisted');
            showToast('❤️ Added to wishlist!');
        } else {
            wl2.splice(idx, 1);
            wishBtn.innerHTML = '&#9825; Wishlist';
            wishBtn.classList.remove('wishlisted');
            showToast('💔 Removed from wishlist!');
        }
        saveWishlist(wl2);
    });
}

function closeProductModal() {
    document.getElementById('product-detail-page').classList.remove('open');
    document.body.style.overflow = '';
}

// ========== INJECT CART DRAWER + TOAST + PRODUCT MODAL ==========
document.addEventListener('DOMContentLoaded', function () {
    document.body.insertAdjacentHTML('beforeend', `
    <div id="cart-drawer-overlay" onclick="closeCartDrawer()"></div>
    <div id="cart-drawer">
        <div class="cart-drawer-header">
            <h3>Your Cart 🛒</h3>
            <button onclick="closeCartDrawer()">&times;</button>
        </div>
        <div id="cart-drawer-body"></div>
        <div class="cart-drawer-footer">
            <div class="cart-footer-total">Total: <span id="cart-total">Rs.0</span></div>
            <button class="checkout-btn" onclick="window.location.href='payment.html'">Proceed to Checkout</button>
        </div>
    </div>
    <div id="product-detail-page"></div>
    <div id="payment-page"></div>
    <div id="fb-toast"></div>`);

    // Make cart icon clickable
    document.querySelectorAll('.icon-item').forEach(el => {
        if (el.querySelector('circle[cx="9"]')) {
            el.style.cursor = 'pointer';
            el.addEventListener('click', openCartDrawer);
        }
    });

    // Cookie card listeners
    var cookieItems = [
        { wishId: 'wish-sweet', cartId: 'cart-sweet', name: 'Sweet Cookies', price: 'Rs.650', img: 'Cookies_5.webp' },
        { wishId: 'wish-salted', cartId: 'cart-salted', name: 'Salted Cookies', price: 'Rs.550', img: 'Cookies1_540x.webp' }
    ];
    cookieItems.forEach(function(c) {
        var heart = document.getElementById(c.wishId);
        var cartBtn = document.getElementById(c.cartId);
        if (!heart || !cartBtn) return;
        var wl = getWishlist();
        if (wl.some(function(w) { return w.name === c.name; })) {
            heart.textContent = '♥';
            heart.classList.add('wishlisted');
        }
        heart.addEventListener('click', function(e) {
            e.stopPropagation();
            const wl = getWishlist();
            const idx = wl.findIndex(w => w.name === c.name);
            if (idx === -1) {
                wl.push({ name: c.name, price: c.price, img: c.img });
                heart.textContent = '\u2665';
                heart.classList.add('wishlisted');
                showToast('\u2764\ufe0f Added to wishlist!');
            } else {
                wl.splice(idx, 1);
                heart.textContent = '\u2661';
                heart.classList.remove('wishlisted');
                showToast('\ud83d\udc94 Removed from wishlist!');
            }
            saveWishlist(wl);
            updateBadges();
        });
        cartBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            addToCart(c.name, c.price, c.img);
        });
    });

    // Cookie card click -> product modal
    cookieItems.forEach(function(c) {
        var card = document.getElementById(c.wishId);
        if (!card) return;
        var cookieCard = card.closest('.cookie-card');
        if (!cookieCard) return;
        cookieCard.style.cursor = 'pointer';
        cookieCard.addEventListener('click', function() {
            openProductModal({ name: c.name, price: c.price, img: c.img });
        });
    });

    updateBadges();
    renderCartDrawer();
});

function openCartDrawer() {
    renderCartDrawer();
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-drawer-overlay').classList.add('open');
}
function closeCartDrawer() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-drawer-overlay').classList.remove('open');
}

// ========== CREATE CAKE CARD ==========
function createCakeCard(item) {
    const wl = getWishlist();
    const isWished = wl.some(w => w.name === item.name);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';

    const imgBox = document.createElement('div');
    imgBox.className = 'img-box';

    const heart = document.createElement('span');
    heart.className = 'heart-icon' + (isWished ? ' wishlisted' : '');
    heart.textContent = isWished ? '♥' : '♡';
    heart.title = isWished ? 'Remove from Wishlist' : 'Add to Wishlist';
    heart.addEventListener('click', function(e) {
        e.stopPropagation();
        const wl = getWishlist();
        const idx = wl.findIndex(w => w.name === item.name);
        if (idx === -1) {
            wl.push({ name: item.name, price: item.price, img: item.img });
            heart.textContent = '♥';
            heart.classList.add('wishlisted');
            heart.title = 'Remove from Wishlist';
            showToast('❤️ Added to wishlist!');
        } else {
            wl.splice(idx, 1);
            heart.textContent = '♡';
            heart.classList.remove('wishlisted');
            heart.title = 'Add to Wishlist';
            showToast('💔 Removed from wishlist!');
        }
        saveWishlist(wl);
    });

    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.name;
    img.style.cursor = 'pointer';
    img.addEventListener('click', function(e) {
        e.stopPropagation();
        openProductModal(item);
    });

    imgBox.appendChild(heart);
    imgBox.appendChild(img);

    const info = document.createElement('div');
    info.className = 'cake-info';
    info.innerHTML = `
        <div class="name">${item.name}</div>
        <div class="price">From ${item.price}</div>
        <div class="view-detail-hint"></div>`;

    card.appendChild(imgBox);
    card.appendChild(info);

    return card;
}

// ========== LOAD CAKE DATA ==========
async function loadCakeData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("JSON file nahi mil rahi!");
        const cakeData = await response.json();
        const grid = document.getElementById('cake-grid');
        const slider = document.getElementById('slider-content');

        cakeData.forEach((item, index) => {
            if (grid) grid.appendChild(createCakeCard(item));

            if (slider) {
                const slide = document.createElement('div');
                slide.className = 'carousel-item text-center' + (index === 0 ? ' active' : '');
                
                const cakeCard = createCakeCard(item);
cakeCard.style.width = '100%';
cakeCard.style.maxWidth = '100%';
slide.appendChild(cakeCard);
                slider.appendChild(slide);
            }
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

document.addEventListener('DOMContentLoaded', loadCakeData);
document.addEventListener('DOMContentLoaded', function () {
    const cakeSlider = document.getElementById('cakeSlider');

    if (cakeSlider && typeof bootstrap !== 'undefined') {
        new bootstrap.Carousel(cakeSlider, {
            interval: 3000,
            ride: 'carousel',
            wrap: true
        });
    }
});

// ========== LOAD COMBO DATA ==========
async function loadComboData() {
    try {
        const response = await fetch('combo.json');
        if (!response.ok) return;
        const data = await response.json();
        const grid = document.getElementById('combo-grid');
        if (!grid) return;
        data.forEach(item => grid.appendChild(createCakeCard(item)));
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', loadComboData);

fetch("images.json")
  .then(res => res.json())
  .then(data => {
    const slider = document.getElementById("insta2Slider");

    data.posts.forEach(post => {
      const card = document.createElement("div");
      card.className = "insta2-card";

      card.innerHTML = `
        <img src="${post.img}">
        <div class="insta2-overlay">
          <a href="https://www.instagram.com/fantasybakeryindore/" target="_blank">
            <i class="fa-brands fa-instagram"></i>
          </a>
        </div>
      `;

      slider.appendChild(card);
    });
  });

// Inject Modal HTML into body
document.addEventListener('DOMContentLoaded', function () {
    const modalHTML = `
    <div class="modal-overlay" id="signinModal">
      <div class="modal-content">
        <span class="close-btn" onclick="closeModal()">&times;</span>
        <div class="modal-logo"><img src="Fantasy_Logo_135x.png" alt="logo"></div>
        <div class="auth-tabs">
          <button class="tab-btn active" id="loginTab" onclick="switchTab('login')">Sign In</button>
          <button class="tab-btn" id="registerTab" onclick="switchTab('register')">Register</button>
        </div>
        <div id="loginSection">
          <div id="emailSection">
            <h2>Welcome Back!</h2>
            <p class="subtitle">Enter your email to continue</p>
            <form onsubmit="sendCode(event)">
              <div class="input-group">
                <input type="email" id="userEmail" placeholder="Enter your email" required>
              </div>
              <button type="submit" class="continue-btn">Send OTP</button>
            </form>
          </div>
          <div id="otpSection" style="display:none">
            <h2>Verify OTP</h2>
            <p class="subtitle">Code sent to <span id="displayEmail"></span></p>
            <form onsubmit="verifyOTP(event)">
              <div class="input-group">
                <input type="text" id="otpCode" placeholder="Enter 6-digit code" maxlength="6" required>
              </div>
              <button type="submit" class="continue-btn">Verify & Sign In</button>
            </form>
            <p class="resend-text">Didn't receive? <a href="#" onclick="resendOTP(); return false;">Resend OTP</a></p>
          </div>
        </div>
        <div id="registerSection" style="display:none">
          <h2>Create Account</h2>
          <p class="subtitle">Join Fantasy Bakery today!</p>
          <form onsubmit="registerUser(event)">
            <div class="input-group">
              <input type="text" id="regName" placeholder="Full Name" required>
              <input type="email" id="regEmail" placeholder="Email Address" required>
              <input type="tel" id="regPhone" placeholder="Phone Number" required>
              <input type="password" id="regPassword" placeholder="Password" required>
            </div>
            <div class="checkbox-group">
              <input type="checkbox" id="agreeTerms" required>
              <label for="agreeTerms">I agree to the Terms & Conditions</label>
            </div>
            <button type="submit" class="continue-btn" style="margin-top:15px">Create Account</button>
          </form>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
});

// Modal Functions
function openModal(tab = 'login') {
    document.getElementById('signinModal').style.display = 'flex';
    switchTab(tab);
}

function closeModal() {
    document.getElementById('signinModal').style.display = 'none';
    // Reset forms
    document.getElementById('emailSection').style.display = 'block';
    document.getElementById('otpSection').style.display = 'none';
}

function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('loginSection').style.display = isLogin ? 'block' : 'none';
    document.getElementById('registerSection').style.display = isLogin ? 'none' : 'block';
    document.getElementById('loginTab').classList.toggle('active', isLogin);
    document.getElementById('registerTab').classList.toggle('active', !isLogin);
}

// Handle Email Submission
function sendCode(event) {
    event.preventDefault();
    const email = document.getElementById('userEmail').value;
    if (email) {
        document.getElementById('displayEmail').innerText = email;
        document.getElementById('emailSection').style.display = 'none';
        document.getElementById('otpSection').style.display = 'block';
        console.log("Sending OTP to: " + email);
    }
}

function resendOTP() {
    const email = document.getElementById('displayEmail').innerText;
    alert('OTP resent to ' + email);
}

// Handle OTP Verification
function verifyOTP(event) {
    event.preventDefault();
    const code = document.getElementById('otpCode').value;
    if (code === "123456") {
        alert("Sign In Successful! Welcome back!");
        closeModal();
    } else {
        alert("Invalid OTP. Please try again.");
        document.getElementById('otpCode').value = '';
    }
}

// Handle Registration
function registerUser(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;

    if (password.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }

    // Save to localStorage (frontend-only demo)
    const users = JSON.parse(localStorage.getItem('fb_users') || '[]');
    if (users.find(u => u.email === email)) {
        alert('An account with this email already exists. Please sign in.');
        switchTab('login');
        return;
    }
    users.push({ name, email, phone, password });
    localStorage.setItem('fb_users', JSON.stringify(users));
    alert(`Account created successfully! Welcome, ${name}!`);
    closeModal();
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('signinModal');
    if (modal && event.target === modal) closeModal();
});

fetch("rakhi.json")

.then(response => response.json())

.then(data => {

    let products = document.getElementById("products");

    data.forEach(item => {

        products.innerHTML += `

        <div class="product-card">

            <div class="wishlist">

                <i class="fa-regular fa-heart"></i>

            </div>

            <img src="${item.image}">

            <div class="product-info">

                <h3>${item.name}</h3>

                <p>From Rs.${item.price}</p>

            </div>

        </div>

        `;
    });

});
fetch("mother.json")

.then((response)=>{
    return response.json();
})

.then((data)=>{

    let motherdayCards = "";

    data.forEach((item)=>{

        motherdayCards += `

        <div class="motherday-single-card">

            <div class="motherday-heart-icon">♡</div>

            <div class="motherday-image-box">

                <img src="${item.image}">

            </div>

            <h3 class="motherday-cake-title">
                ${item.name}
            </h3>

            <p class="motherday-cake-price">
                ${item.price}
            </p>

        </div>

        `;

    });

    document.getElementById("motherdayCardContainer").innerHTML = motherdayCards;

})

// Example JS Rendering Loop



/* ======================================
   CAKE PAGE MOBILE CAROUSEL
   Uses existing cake-grid cards
   ====================================== */


async function loadCakeData() {
    try {
        const response = await fetch('data.json');

        if (!response.ok) {
            throw new Error("Cake data load nahi hua");
        }

        const cakeData = await response.json();

        const grid = document.getElementById('cake-grid');
        const slider = document.getElementById('slider-content');

        if (grid) grid.innerHTML = "";
        if (slider) slider.innerHTML = "";

        cakeData.forEach((item, index) => {

            // Desktop cake cards
            if (grid) {
                grid.appendChild(createCakeCard(item));
            }

            // Existing home page slider
            if (slider) {
                const slide = document.createElement('div');
                slide.className = 'carousel-item text-center' +
                    (index === 0 ? ' active' : '');

                const cakeCard = createCakeCard(item);
                cakeCard.style.width = '100%';
                cakeCard.style.maxWidth = '100%';

                slide.appendChild(cakeCard);
                slider.appendChild(slide);
            }
        });

        // Mobile carousel images
        const mobileSlides = document.getElementById('cakeMobileSlides');

        if (mobileSlides) {
            mobileSlides.innerHTML = "";

            cakeData.forEach((item, index) => {
                const slide = document.createElement('div');

                slide.className = 'carousel-item' +
                    (index === 0 ? ' active' : '');

                const imageBox = document.createElement('div');
                imageBox.className = 'mobile-cake-image-box';

                const image = document.createElement('img');
                image.src = item.img;
                image.alt = item.name;
                image.className = 'mobile-cake-image';

                image.addEventListener('click', () => {
                    openProductModal(item);
                });

                imageBox.appendChild(image);

                slide.appendChild(imageBox);
                mobileSlides.appendChild(slide);
            });

            const carouselElement =
                document.getElementById('cakeMobileCarousel');

            if (carouselElement && typeof bootstrap !== 'undefined') {
                const oldCarousel =
                    bootstrap.Carousel.getInstance(carouselElement);

                if (oldCarousel) oldCarousel.dispose();

                new bootstrap.Carousel(carouselElement, {
                    interval: 3000,
                    ride: 'carousel',
                    wrap: true
                });
            }
        }

    } catch (error) {
        console.error("Cake loading error:", error);
    }
}

/* ======================================
   CAKE PAGE MOBILE CAROUSEL
   ====================================== */

async function loadCakeData() {
    try {
        const response = await fetch('data.json');

        if (!response.ok) {
            throw new Error("Cake data load nahi hua");
        }

        const cakeData = await response.json();

        const grid = document.getElementById('cake-grid');
        const slider = document.getElementById('slider-content');
        const mobileSlides = document.getElementById('cakeMobileSlides');

        if (grid) grid.innerHTML = "";
        if (slider) slider.innerHTML = "";
        if (mobileSlides) mobileSlides.innerHTML = "";

        cakeData.forEach((item, index) => {

            // Desktop cake cards
            if (grid) {
                grid.appendChild(createCakeCard(item));
            }

            // Home page slider
            if (slider) {
                const slide = document.createElement('div');
                slide.className = 'carousel-item text-center' +
                    (index === 0 ? ' active' : '');

                const cakeCard = createCakeCard(item);
                cakeCard.style.width = '100%';
                cakeCard.style.maxWidth = '100%';

                slide.appendChild(cakeCard);
                slider.appendChild(slide);
            }

            // Mobile cake carousel
            if (mobileSlides) {
                const slide = document.createElement('div');
                slide.className = 'carousel-item' +
                    (index === 0 ? ' active' : '');

                const imageBox = document.createElement('div');
                imageBox.className = 'mobile-cake-image-box';

                const image = document.createElement('img');
                image.src = item.img;
                image.alt = item.name;
                image.className = 'mobile-cake-image';

                image.addEventListener('click', () => {
                    openProductModal(item);
                });

                // Check existing wishlist
                const isWished = getWishlist().some(
                    w => w.name === item.name
                );

                // Mobile heart button
                const heart = document.createElement('button');
                heart.type = 'button';
                heart.className = 'mobile-wishlist-btn' +
                    (isWished ? ' wishlisted' : '');

                heart.textContent = isWished ? '♥' : '♡';

                // Same wishlist storage as desktop
                heart.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const wishlist = getWishlist();
                    const index = wishlist.findIndex(
                        w => w.name === item.name
                    );

                    if (index === -1) {
                        wishlist.push({
                            name: item.name,
                            price: item.price,
                            img: item.img
                        });

                        heart.textContent = '♥';
                        heart.classList.add('wishlisted');
                        showToast('❤️ Added to wishlist!');
                    } else {
                        wishlist.splice(index, 1);

                        heart.textContent = '♡';
                        heart.classList.remove('wishlisted');
                        showToast('💔 Removed from wishlist!');
                    }

                    saveWishlist(wishlist);
                });

                imageBox.appendChild(image);
                imageBox.appendChild(heart);

                slide.appendChild(imageBox);
                mobileSlides.appendChild(slide);
            }
        });

        // Initialize mobile carousel
        const carouselElement =
            document.getElementById('cakeMobileCarousel');

        if (carouselElement && mobileSlides &&
            typeof bootstrap !== 'undefined') {

            const oldCarousel =
                bootstrap.Carousel.getInstance(carouselElement);

            if (oldCarousel) oldCarousel.dispose();

            new bootstrap.Carousel(carouselElement, {
                interval: 3000,
                ride: 'carousel',
                wrap: true
            });
        }

    } catch (error) {
        console.error("Cake loading error:", error);
    }
}

document.addEventListener('DOMContentLoaded', loadCakeData);



/* =================================
   COOKIES PAGE RESPONSIVE CAROUSEL
================================= */

function loadCookieCards() {

    const cookies = [
        {
            name: "Sweet Cookies",
            price: 650,
            img: "Cookies_5.webp"
        },
        {
            name: "Salted Cookies",
            price: 550,
            img: "Cookies1_540x.webp"
        }
    ];

    const grid = document.getElementById("cookie-grid");
    const mobileSlides = document.getElementById("cookieMobileSlides");

    if (!grid && !mobileSlides) return;

    if (grid) grid.innerHTML = "";
    if (mobileSlides) mobileSlides.innerHTML = "";

    cookies.forEach((item, index) => {

        // DESKTOP CARD
        if (grid) {
            const card = createCookieCard(item);
            grid.appendChild(card);
        }

        // MOBILE CAROUSEL CARD
        if (mobileSlides) {

            const slide = document.createElement("div");
            slide.className = "carousel-item" + (index === 0 ? " active" : "");

            const card = createCookieCard(item);
            card.classList.add("cookie-mobile-card");

            slide.appendChild(card);
            mobileSlides.appendChild(slide);
        }
    });

    // INITIALIZE MOBILE CAROUSEL
    const carouselElement = document.getElementById("cookieMobileCarousel");

    if (carouselElement && mobileSlides && typeof bootstrap !== "undefined") {

        const oldCarousel = bootstrap.Carousel.getInstance(carouselElement);

        if (oldCarousel) oldCarousel.dispose();

        new bootstrap.Carousel(carouselElement, {
            interval: 3000,
            ride: "carousel",
            wrap: true
        });
    }
}


// CREATE COOKIE CARD
function createCookieCard(item) {

    const card = document.createElement("div");
    card.className = "cookie-card";

    const imageBox = document.createElement("div");
    imageBox.className = "cookie-img-box";

    const image = document.createElement("img");
image.src = item.img;
image.alt = item.name;
image.className = "cookie-img";
image.style.cursor = "pointer";

// Open Product Details on Image Click
image.addEventListener("click", function(e) {
    e.stopPropagation();

    openProductModal({
        ...item,
        price: `Rs.${item.price}`
    });
});
    // CHECK WISHLIST
    const isWished = getWishlist().some(
        w => w.name === item.name
    );

    // WISHLIST HEART
    const heart = document.createElement("button");
    heart.type = "button";
    heart.className = "cookie-heart" + (isWished ? " wishlisted" : "");
    heart.innerHTML = isWished ? "♥" : "♡";

    heart.addEventListener("click", function(e) {

        e.preventDefault();
        e.stopPropagation();

        const wishlist = getWishlist();

        const index = wishlist.findIndex(
            w => w.name === item.name
        );

        if (index === -1) {

            wishlist.push({
                name: item.name,
                price: item.price,
                img: item.img
            });

            heart.innerHTML = "♥";
            heart.classList.add("wishlisted");

            showToast("❤️ Added to wishlist!");

        } else {

            wishlist.splice(index, 1);

            heart.innerHTML = "♡";
            heart.classList.remove("wishlisted");

            showToast("💔 Removed from wishlist!");
        }

        saveWishlist(wishlist);
    });

    imageBox.appendChild(image);
    imageBox.appendChild(heart);

    const info = document.createElement("div");
    info.className = "cookie-info";

    info.innerHTML = `
        <h4>${item.name}</h4>
        <p>Rs.${item.price}</p>
    `;

    card.appendChild(imageBox);
    card.appendChild(info);

    return card;
}


// LOAD WHEN PAGE OPENS
document.addEventListener("DOMContentLoaded", loadCookieCards);
// ========== LOAD COMBO DATA ==========

// ========== LOAD COMBO DATA ==========
async function loadComboData() {
    try {
        const response = await fetch('combo.json');

        if (!response.ok) {
            throw new Error("Combo data load nahi hua!");
        }

        const data = await response.json();

        const grid = document.getElementById('combo-grid');
        const mobileSlides = document.getElementById('comboMobileSlides');

        if (grid) grid.innerHTML = "";
        if (mobileSlides) mobileSlides.innerHTML = "";

        data.forEach((item, index) => {

            // Desktop grid
            if (grid) {
                grid.appendChild(createCakeCard(item));
            }

            // Mobile slider
            if (mobileSlides) {
                const slide = document.createElement('div');

                slide.className =
                    'carousel-item' + (index === 0 ? ' active' : '');

                const comboCard = createCakeCard(item);

                comboCard.style.width = '100%';
                comboCard.style.maxWidth = '100%';
                comboCard.style.margin = '0 auto';

                slide.appendChild(comboCard);
                mobileSlides.appendChild(slide);
            }
        });

        // Initialize mobile slider
        const carouselElement =
            document.getElementById('comboMobileCarousel');

        if (carouselElement && mobileSlides &&
            typeof bootstrap !== 'undefined') {

            const oldCarousel =
                bootstrap.Carousel.getInstance(carouselElement);

            if (oldCarousel) oldCarousel.dispose();

            new bootstrap.Carousel(carouselElement, {
                interval: 3500,
                ride: 'carousel',
                wrap: true,
                pause: false
            });
        }

    } catch (error) {
        console.error("Combo loading error:", error);
    }
}

document.addEventListener('DOMContentLoaded', loadComboData);

fetch("rakhi.json")
    .then(response => response.json())
    .then(data => {

        let products = document.getElementById("products");

        products.innerHTML = "";

        data.forEach(item => {

            const product = {
                name: item.name,
                price: `Rs.${item.price}`,
                img: item.image
            };

            products.innerHTML += `
                <div class="product-card">

                    <div class="wishlist">
                        <i class="fa-regular fa-heart"></i>
                    </div>

                    <img 
                        src="${item.image}" 
                        alt="${item.name}"
                        onclick='openProductModal(${JSON.stringify(product).replace(/'/g, "&#39;")})'
                    >

                    <div class="product-info">
                        <h3>${item.name}</h3>
                        <p>From Rs.${item.price}</p>
                    </div>

                </div>
            `;
        });

    })
    .catch(error => console.log("Rakhi products loading error:", error));
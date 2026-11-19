const COUPONS = { 'FANTASY10': 10, 'CAKE20': 20, 'SWEET15': 15 };
let discountPct = 0;

function getCart() {
    return JSON.parse(localStorage.getItem('fb_cart') || '[]');
}

function renderSummary() {
    const cart = getCart();
    const container = document.getElementById('summary-items');
    const subtotalEl = document.getElementById('subtotal');
    const grandTotalEl = document.getElementById('grand-total');

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#bbb;padding:20px 0">Your cart is empty 🛒</p>';
        subtotalEl.textContent = 'Rs.0';
        grandTotalEl.textContent = 'Rs.0';
        document.getElementById('place-order-btn').disabled = true;
        return;
    }

    let sum = 0;
    container.innerHTML = cart.map(item => {
        const price = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        sum += price * item.qty;
        return `
        <div class="s-item">
            <img src="${item.img}" alt="${item.name}">
            <div class="s-item-info">
                <div class="s-item-name">${item.name}</div>
                <div class="s-item-qty">Qty: ${item.qty}</div>
                <div class="s-item-price">${item.price} × ${item.qty}</div>
            </div>
        </div>`;
    }).join('');

    subtotalEl.textContent = 'Rs.' + sum.toLocaleString();
    const discount = Math.round(sum * discountPct / 100);
    const total = sum - discount;

    if (discount > 0) {
        document.getElementById('discount-row').style.display = 'flex';
        document.getElementById('discount-val').textContent = '-Rs.' + discount.toLocaleString();
    }
    grandTotalEl.textContent = 'Rs.' + total.toLocaleString();
    document.getElementById('place-order-btn').disabled = false;
}

function selectPayment(type) {
    ['upi', 'card', 'netbanking', 'cod'].forEach(t => {
        document.getElementById('opt-' + t).classList.remove('co-selected');
    });
    document.getElementById('opt-' + type).classList.add('co-selected');
    document.getElementById('upi-wrap').classList.toggle('co-show', type === 'upi');
    document.getElementById('card-wrap').classList.toggle('co-show', type === 'card');
}

function applyCoupon() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    const msg = document.getElementById('coupon-msg');
    if (COUPONS[code]) {
        discountPct = COUPONS[code];
        msg.textContent = '✅ ' + discountPct + '% discount applied!';
        msg.className = 'coupon-msg success';
        renderSummary();
    } else {
        msg.textContent = '❌ Invalid coupon code';
        msg.className = 'coupon-msg error';
    }
}

function validateForm() {
    const name = document.getElementById('fname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const date = document.getElementById('delivery-date').value;

    if (!name) { alert('Please enter your name!'); document.getElementById('fname').focus(); return false; }
    if (!/^[0-9]{10}$/.test(phone)) { alert('Enter a valid 10-digit phone number!'); document.getElementById('phone').focus(); return false; }
    if (!address) { alert('Please enter delivery address!'); document.getElementById('address').focus(); return false; }
    if (!date) { alert('Please select delivery date!'); document.getElementById('delivery-date').focus(); return false; }

    const payMethod = document.querySelector('input[name="payment"]:checked').value;
    if (payMethod === 'upi') {
        const upi = document.getElementById('upi-id').value.trim();
        if (!upi || !upi.includes('@')) { alert('Enter a valid UPI ID!'); return false; }
    }
    if (payMethod === 'card') {
        if (document.getElementById('card-num').value.replace(/\s/g, '').length < 16) { alert('Enter a valid card number!'); return false; }
        if (!document.getElementById('card-exp').value) { alert('Enter card expiry!'); return false; }
        if (document.getElementById('card-cvv').value.length < 3) { alert('Enter valid CVV!'); return false; }
    }
    return true;
}

function placeOrder() {
    if (!validateForm()) return;
    const cart = getCart();
    if (cart.length === 0) { alert('Your cart is empty!'); return; }

    const btn = document.getElementById('place-order-btn');
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    setTimeout(function() {
        const orderId = 'FB' + Date.now().toString().slice(-8).toUpperCase();
        const name = document.getElementById('fname').value.trim();
        const date = document.getElementById('delivery-date').value;

        document.getElementById('success-name').textContent = 'Hi ' + name + ', your order is confirmed!';
        document.getElementById('success-order-id').textContent = 'Order ID: ' + orderId;
        document.getElementById('success-delivery').textContent = '🚚 Expected Delivery: ' + new Date(date).toDateString();
        document.getElementById('success-page').classList.add('show');
        localStorage.removeItem('fb_cart');
    }, 1800);
}

document.addEventListener('DOMContentLoaded', function() {
    renderSummary();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('delivery-date').min = tomorrow.toISOString().split('T')[0];

    const cardNum = document.getElementById('card-num');
    if (cardNum) {
        cardNum.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '').substring(0, 16);
            this.value = val.replace(/(.{4})/g, '$1 ').trim();
        });
    }

    const cardExp = document.getElementById('card-exp');
    if (cardExp) {
        cardExp.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '').substring(0, 4);
            if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
            this.value = val;
        });
    }
});

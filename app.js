// QTable Demo - Main Application Logic
const MENU_DATA = {
    popular: [
        { id: 1, name: '눈꽃치즈 떡볶이', desc: '매콤달콤한 소스에 눈꽃 치즈가 듬뿍!', price: 6500, emoji: '🍜', image: 'images/tteokbokki.png', tag: 'BEST' },
        { id: 2, name: '수제 튀김범벅', desc: '바삭한 모듬튀김과 떡볶이 소스의 만남', price: 7000, emoji: '🍤', image: 'images/fried_mix.png', tag: '인기' },
        { id: 3, name: '참치마요 김밥', desc: '고소한 참치와 마요네즈의 환상 조합', price: 4500, emoji: '🍙', image: 'images/gimbap.png', tag: '알차요' },
        { id: 4, name: '해장 차돌라면', desc: '진한 사골육수에 차돌박이가 가득', price: 6000, emoji: '🍜', image: 'images/ramyeon.png', tag: '해장추천' }
    ],
    main: [
        { id: 5, name: '왕 돈까스', desc: '두툼한 국내산 등심으로 만든 경양식 돈까스', price: 9500, emoji: '🍛', image: 'images/tonkatsu.png' },
        { id: 6, name: '돌솥 비빔밥', desc: '지글지글 소리까지 맛있는 영양 비빔밥', price: 8500, emoji: '🍚', image: 'images/bibimbap.png' },
        { id: 7, name: '돼지고기 김치찌개', desc: '숙성 김치와 생고기의 깊은 맛', price: 8000, emoji: '🍲', image: 'images/kimchi_stew.png' },
        { id: 8, name: '철판 제육볶음', desc: '불맛 가득한 매콤달콤 밥도둑', price: 9000, emoji: '🥘', image: 'images/spicy_pork.png' }
    ],
    side: [
        { id: 9, name: '바삭 모듬튀김', desc: '오징어, 김말이, 야채, 고구마 튀김', price: 5000, emoji: '🍤', image: 'images/fried_assorted.png' },
        { id: 10, name: '육즙 팡팡 군만두', desc: '겉바속촉 육즙 가득한 만두 (5개)', price: 4500, emoji: '🥟', image: 'images/dumplings.png' },
        { id: 11, name: '부산 꼬치어묵', desc: '깊은 국물맛이 일품인 꼬치어묵 (3개)', price: 4000, emoji: '🍢', image: 'images/fish_cake.png' },
        { id: 12, name: '찰순대', desc: '쫄깃쫄깃 찰순대와 내장', price: 5000, emoji: '🥓', image: 'images/sundae.png' }
    ],
    drink: [
        { id: 13, name: '코카콜라', desc: '톡 쏘는 탄산 355ml', price: 2000, emoji: '🥤', image: 'images/cola.png' },
        { id: 14, name: '칠성사이다', desc: '시원한 청량감 355ml', price: 2000, emoji: '🥤', image: 'images/cider.png' },
        { id: 15, name: '크림 생맥주', desc: '부드러운 거품 500cc', price: 4500, emoji: '🍺', image: 'images/beer.png' },
        { id: 16, name: '참이슬/처음처럼', desc: '국민 소주', price: 5000, emoji: '🍶', image: 'images/soju.png' }
    ]
};

let cart = [];
let currentCategory = 'popular';
let selectedMenuItem = null;
let selectedQuantity = 1;
let peopleCount = 2;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1500);

    renderMenu(currentCategory);
    setupEventListeners();
});

function setupEventListeners() {
    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            renderMenu(currentCategory);
        });
    });

    // Cart FAB
    document.getElementById('cart-fab').addEventListener('click', openCartModal);

    // Payment type toggle
    document.querySelectorAll('input[name="payment-type"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const dutchSelector = document.getElementById('dutch-pay-selector');
            if (e.target.value === 'dutch') {
                dutchSelector.classList.remove('hidden');
                updatePerPersonAmount();
            } else {
                dutchSelector.classList.add('hidden');
            }
        });
    });

    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', () => {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
        });
    });
}

function renderMenu(category) {
    const grid = document.getElementById('menu-grid');
    const items = MENU_DATA[category] || [];

    grid.innerHTML = items.map(item => {
        const imageHtml = item.image
            ? `<img src="${item.image}" alt="${item.name}" class="menu-image" loading="lazy">`
            : `<div class="menu-image-placeholder">${item.emoji}</div>`;

        const tagHtml = item.tag
            ? `<span class="menu-tag">${item.tag}</span>`
            : '';

        return `
        <div class="menu-item" onclick="openMenuDetail(${item.id})">
            <div class="menu-image-container">
                ${imageHtml}
                ${tagHtml}
            </div>
            <div class="menu-info">
                <h3 class="menu-name">${item.name}</h3>
                <p class="menu-desc-short">${item.desc}</p>
                <p class="menu-price">${formatPrice(item.price)}</p>
            </div>
            <button class="menu-add-btn">+</button>
        </div>
    `}).join('');
}

function findMenuItem(id) {
    for (const category of Object.values(MENU_DATA)) {
        const item = category.find(i => i.id === id);
        if (item) return item;
    }
    return null;
}

function openMenuDetail(id) {
    selectedMenuItem = findMenuItem(id);
    selectedQuantity = 1;

    if (!selectedMenuItem) return;

    const imageHtml = selectedMenuItem.image
        ? `<img src="${selectedMenuItem.image}" alt="${selectedMenuItem.name}">`
        : `<div class="placeholder">${selectedMenuItem.emoji}</div>`;

    const modal = document.getElementById('menu-detail-modal');
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeMenuDetail()"></div>
        <div class="modal-content menu-detail-content">
            <button class="modal-close" onclick="closeMenuDetail()">✕</button>
            <div class="menu-detail-image">
                ${imageHtml}
            </div>
            <div class="menu-detail-info">
                <h2 class="menu-detail-name">${selectedMenuItem.name}</h2>
                <p class="menu-detail-desc">${selectedMenuItem.desc}</p>
                <div class="menu-detail-price-row">
                    <span class="price-label">가격</span>
                    <span class="menu-detail-price">${formatPrice(selectedMenuItem.price)}</span>
                </div>
            </div>
            <div class="menu-detail-quantity">
                <button class="qty-btn" onclick="changeQuantity(-1)">−</button>
                <span id="menu-detail-qty">${selectedQuantity}</span>
                <button class="qty-btn" onclick="changeQuantity(1)">+</button>
            </div>
            <button class="btn-add-cart" onclick="addToCartFromDetail()">
                <span id="add-cart-total">${formatPrice(selectedMenuItem.price)}</span> 담기
            </button>
        </div>
    `;
    modal.classList.add('active');
}

function closeMenuDetail() {
    document.getElementById('menu-detail-modal').classList.remove('active');
}

function changeQuantity(delta) {
    selectedQuantity = Math.max(1, selectedQuantity + delta);
    document.getElementById('menu-detail-qty').textContent = selectedQuantity;
    document.getElementById('add-cart-total').textContent = formatPrice(selectedMenuItem.price * selectedQuantity);
}

function addToCartFromDetail() {
    const existing = cart.find(item => item.id === selectedMenuItem.id);
    if (existing) {
        existing.quantity += selectedQuantity;
    } else {
        cart.push({ ...selectedMenuItem, quantity: selectedQuantity });
    }
    closeMenuDetail();
    updateCartUI();
    showToast(`${selectedMenuItem.name} ${selectedQuantity}개 담김!`);
}

function updateCartUI() {
    const fab = document.getElementById('cart-fab');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (count > 0) {
        fab.classList.remove('hidden');
        document.getElementById('cart-count').textContent = count;
        document.getElementById('cart-total').textContent = formatPrice(total);
    } else {
        fab.classList.add('hidden');
    }
}

function openCartModal() {
    const modal = document.getElementById('cart-modal');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeCartModal()"></div>
        <div class="modal-content cart-modal-content">
            <div class="modal-header">
                <h2>🛒 장바구니</h2>
                <button class="modal-close" onclick="closeCartModal()">✕</button>
            </div>
            <div class="cart-items">
                ${cart.map((item, idx) => `
                    <div class="cart-item">
                        <span class="cart-item-emoji">${item.emoji}</span>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">${formatPrice(item.price)}</div>
                        </div>
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="updateCartItem(${idx}, -1)">−</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateCartItem(${idx}, 1)">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="cart-summary">
                <div class="summary-row"><span>주문 금액</span><span>${formatPrice(total)}</span></div>
                <div class="summary-row total"><span>총 결제 금액</span><span>${formatPrice(total)}</span></div>
            </div>
            <div class="cart-actions">
                <button class="btn btn-secondary" onclick="closeCartModal()">더 담기</button>
                <button class="btn btn-primary" onclick="goToPayment()">결제하기</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

function closeCartModal() {
    document.getElementById('cart-modal').classList.remove('active');
}

function updateCartItem(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
    if (cart.length > 0) {
        openCartModal();
    } else {
        closeCartModal();
    }
}

function formatPrice(price) {
    return price.toLocaleString('ko-KR') + '원';
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.8); color: white; padding: 12px 24px;
        border-radius: 50px; font-size: 0.9rem; z-index: 9999;
        animation: fadeInOut 2s ease-in-out forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Add toast animation
const style = document.createElement('style');
style.textContent = `@keyframes fadeInOut { 0%, 100% { opacity: 0; } 20%, 80% { opacity: 1; } }`;
document.head.appendChild(style);

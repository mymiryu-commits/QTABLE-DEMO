
// Payment, Membership(CRM), & Complete Functions (With PeerJS Remote & Table ID)

// --- 통신 설정 (P2P & Local) ---
let peer = null;
let conn = null;
let currentTableNumber = null; // 현재 테이블 번호
const bc = new BroadcastChannel('qtable_demo');

function initRemoteConnection() {
    // 1. URL 파라미터 확인 (사장님 ID, 테이블 번호)
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('store');
    currentTableNumber = urlParams.get('table'); // 테이블 번호 파싱

    // 테이블 번호가 있다면 UI에 잠시 표시 (UX 개선)
    if (currentTableNumber) {
        showTableIndicator(currentTableNumber);
    }

    if (storeId && typeof Peer !== 'undefined') {
        const myId = 'customer-' + Math.floor(Math.random() * 10000);
        peer = new Peer(myId);

        peer.on('open', (id) => {
            console.log('Customer Peer ID:', id);
            // 사장님에게 연결 시도
            conn = peer.connect(storeId);

            conn.on('open', () => {
                console.log('Connected to Store:', storeId);
                showToast(`✅ 주문 연결됨 (테이블 ${currentTableNumber || '미지정'})`);
            });

            conn.on('error', (err) => console.error('Connection Error:', err));
        });

        peer.on('error', (err) => console.error('Peer Error:', err));
    }
}

// 통합 데이터 전송 함수
function sendDataToOwner(type, payload) {
    // 테이블 번호 추가
    if (currentTableNumber) {
        payload.tableNumber = currentTableNumber;
    }

    // 1. 로컬 전송 (BroadcastChannel)
    try {
        bc.postMessage({ type: type, data: payload });
    } catch (e) { }

    // 2. 원격 전송 (PeerJS)
    if (conn && conn.open) {
        conn.send({ type: type, data: payload });
        console.log('Sent remote data:', type, payload);
    }
}

function showTableIndicator(num) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white;
        padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; z-index: 1001; font-weight: bold;
    `;
    div.textContent = `📍 테이블 ${num}`;
    document.body.appendChild(div);
}
// ------------------------------


// 1. 초간단 인메모리 DB (localStorage 활용)
const MemberDB = {
    getMember: (phone) => {
        try {
            const data = localStorage.getItem('qtable_member_' + phone);
            return data ? JSON.parse(data) : null;
        } catch (e) { return null; }
    },
    saveMember: (phone, data) => {
        try {
            localStorage.setItem('qtable_member_' + phone, JSON.stringify(data));
        } catch (e) { }
    },
    addPoint: (phone, amount) => {
        let member = MemberDB.getMember(phone);
        if (!member) {
            member = { points: 0, visits: 0, gender: '', age: '', lastVisit: null };
        }
        member.points += amount;
        member.visits += 1;
        member.lastVisit = new Date().toISOString();
        MemberDB.saveMember(phone, member);
        return member;
    }
};

let currentMember = null;
let usePoints = 0;

function goToPayment() {
    closeCartModal();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    usePoints = 0;
    currentMember = null;

    const paymentSection = document.getElementById('payment-section');
    paymentSection.innerHTML = `
        <div class="payment-header">
            <button class="back-btn" onclick="goBackToMenu()"><span>←</span></button>
            <h2>결제하기</h2>
            <div class="spacer"></div>
        </div>
        <div class="payment-content">
            <!-- 멤버십 조회 (CRM) -->
            <div class="payment-card membership-card">
                <div class="card-header">
                    <h3>👑 포인트 적립/사용</h3>
                    <span class="badge">3% 적립</span>
                </div>
                <div class="card-desc" style="font-size:0.8rem; color:#666; margin-bottom:8px;">휴대폰 번호만 입력하면 즉시 적립됩니다.</div>
                <div class="phone-input-group">
                    <input type="tel" id="phone-input" placeholder="010-1234-5678" maxlength="13" oninput="autoHyphen(this)">
                    <button class="btn-check" onclick="checkMembership()">조회</button>
                </div>
                <div id="member-info" class="member-info hidden">
                    <!-- 조회 결과 -->
                </div>
            </div>

            <!-- 주문 내역 -->
            <div class="payment-card">
                <h3>📋 주문 내역</h3>
                <div class="payment-total-row">
                    <span>주문 금액</span>
                    <span>${formatPrice(total)}</span>
                </div>
                <div id="point-discount-row" class="payment-total-row discount hidden">
                    <span>포인트 사용</span>
                    <span id="point-discount-amount">-0원</span>
                </div>
                <div class="payment-total-row final">
                    <span>최종 결제 금액</span>
                    <span id="final-total-amount" style="color:#FF6B35; font-size:1.2rem;">${formatPrice(total)}</span>
                </div>
            </div>

            <!-- AI 맞춤 정보 수집 UI (신규/정보없는 고객용) -->
            <div id="ai-survey-card" class="payment-card ai-data-collection">
                <div class="ai-collection-header">
                    <h3>🤖 AI 맞춤 혜택</h3>
                    <span class="discount-badge">데이터 수집</span>
                </div>
                <p class="ai-desc">성별/연령대 정보를 알려주시면<br><strong>맞춤 할인 쿠폰</strong>을 분석해드립니다.</p>
                
                <div class="data-group">
                    <div class="data-label">성별</div>
                    <div class="data-options">
                        <label><input type="radio" name="user-gender" value="female"><span>여성</span></label>
                        <label><input type="radio" name="user-gender" value="male"><span>남성</span></label>
                    </div>
                </div>
                <div class="data-group">
                    <div class="data-label">연령</div>
                    <div class="data-options">
                        <label><input type="radio" name="user-age" value="20"><span>20대</span></label>
                        <label><input type="radio" name="user-age" value="30"><span>30대</span></label>
                        <label><input type="radio" name="user-age" value="40"><span>40대+</span></label>
                    </div>
                </div>
            </div>

            <!-- 결제 수단 -->
            <div class="payment-card">
                <h3>💳 결제 수단</h3>
                <div class="payment-methods">
                    <label class="payment-method selected"><input type="radio" name="p-method" checked><span class="method-icon kakao">카카오페이</span></label>
                    <label class="payment-method"><input type="radio" name="p-method"><span class="method-icon naver">네이버페이</span></label>
                    <label class="payment-method"><input type="radio" name="p-method"><span class="method-icon card">카드</span></label>
                </div>
            </div>
        </div>
        <div class="payment-footer">
            <button class="btn-pay" onclick="processPayment()">
                <span id="pay-btn-text">${formatPrice(total)} 결제하기</span>
            </button>
        </div>
        
        <style>
            .membership-card { border: 2px solid #333; }
            .badge { background: #333; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; }
            .phone-input-group { display: flex; gap: 8px; margin-top: 10px; }
            .phone-input-group input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 1.1rem; }
            .btn-check { background: #333; color: white; border: none; padding: 0 16px; border-radius: 8px; font-weight: bold; }
            .member-info { margin-top: 12px; background: #f5f5f5; padding: 10px; border-radius: 8px; font-size: 0.9rem; }
            .point-box { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
            .use-point-btn { background: #FF6B35; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; }
            .discount { color: #FF4757; }
            .ai-data-collection { border: 1px dashed #6C63FF; background: #F8F7FF; transition: opacity 0.3s; margin-top:16px; }
            .data-options span { padding: 8px 0; border: 1px solid #ddd; border-radius: 6px; display: block; text-align: center; background: white; }
            .data-options input:checked + span { background: #6C63FF; color: white; border-color: #6C63FF; font-weight: bold; }
        </style>
    `;

    paymentSection.classList.remove('hidden');
    document.getElementById('cart-fab').classList.add('hidden');
}

function autoHyphen(target) {
    target.value = target.value.replace(/[^0-9]/g, '').replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
}

function checkMembership() {
    const phone = document.getElementById('phone-input').value;
    if (phone.length < 12) { alert('휴대폰 번호를 입력해주세요.'); return; }

    const member = MemberDB.getMember(phone);
    const infoBox = document.getElementById('member-info');
    const surveyCard = document.getElementById('ai-survey-card');

    infoBox.classList.remove('hidden');

    if (member) {
        currentMember = { ...member, phone };
        infoBox.innerHTML = `
            <div style="color:#03C75A; font-weight:bold; margin-bottom:4px;">👋 ${member.visits}번째 방문이시네요!</div>
            <div class="point-box">
                <span>내 포인트: <strong>${member.points.toLocaleString()}P</strong></span>
                ${member.points > 0 ? `<button class="use-point-btn" onclick="applyPoints(${member.points})">사용하기</button>` : ''}
            </div>
        `;
        // 기존 정보 자동 채우기
        if (member.gender) {
            const gInput = document.querySelector(`input[name="user-gender"][value="${member.gender}"]`);
            if (gInput) gInput.checked = true;
        }
        if (member.age) {
            const aInput = document.querySelector(`input[name="user-age"][value="${member.age}"]`);
            if (aInput) aInput.checked = true;
        }
        surveyCard.style.opacity = '0.6';
    } else {
        currentMember = { phone, new: true };
        infoBox.innerHTML = `
            <div style="color:#FF6B35; font-weight:bold;">🎉 신규 가입 대상입니다</div>
            <div style="font-size:0.85rem; color:#666; margin-top:4px;">결제 완료 시 포인트가 적립됩니다.</div>
        `;
        surveyCard.style.opacity = '1';
    }
}

function applyPoints(amount) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    usePoints = Math.min(amount, total);

    document.getElementById('point-discount-row').classList.remove('hidden');
    document.getElementById('point-discount-amount').textContent = `-${formatPrice(usePoints)}`;
    document.getElementById('final-total-amount').textContent = formatPrice(total - usePoints);
    document.getElementById('pay-btn-text').textContent = `${formatPrice(total - usePoints)} 결제하기`;

    alert(`${usePoints.toLocaleString()} 포인트가 적용되었습니다.`);
}

function processPayment() {
    const payBtn = document.querySelector('.btn-pay');
    payBtn.innerHTML = '<span class="processing">처리 중...</span>';
    payBtn.disabled = true;

    // 사용자 정보 수집
    const gender = document.querySelector('input[name="user-gender"]:checked')?.value || (currentMember?.gender || 'unknown');
    const age = document.querySelector('input[name="user-age"]:checked')?.value || (currentMember?.age || 'unknown');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalAmount = total - usePoints;
    const earnedPoints = Math.floor(finalAmount * 0.03); // 3% 적립

    setTimeout(() => {
        // DB 업데이트
        if (currentMember && currentMember.phone) {
            let m = MemberDB.getMember(currentMember.phone);
            if (!m) m = { points: 0, visits: 0, gender: '', age: '', lastVisit: null };

            m.points = m.points - usePoints + earnedPoints;
            m.visits += 1;
            m.lastVisit = new Date().toISOString();

            if (gender !== 'unknown') m.gender = gender;
            if (age !== 'unknown') m.age = age;

            MemberDB.saveMember(currentMember.phone, m);
            currentMember = { ...m, phone: currentMember.phone };
        }

        const userInfo = {
            gender, age,
            phone: currentMember?.phone || 'Guest',
            isRevisit: currentMember ? currentMember.visits > 1 : false
        };

        showCompleteScreen(userInfo, earnedPoints);
    }, 1500);
}

function showCompleteScreen(userInfo, earnedPoints) {
    document.getElementById('payment-section').classList.add('hidden');
    const orderNumber = '#' + String(Math.floor(Math.random() * 9000) + 1000);

    const completeSection = document.getElementById('complete-section');
    completeSection.innerHTML = `
        <div class="complete-content" style="padding-top: 60px;">
            <div class="complete-animation" style="transform: scale(0.8); margin-bottom: 10px;">
                <div class="check-circle">
                    <svg viewBox="0 0 52 52"><circle class="check-circle-bg" cx="26" cy="26" r="25"/><path class="check-mark" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>
                </div>
            </div>
            
            <h2 class="complete-title">주문 접수 완료!</h2>
            <p class="complete-message">주문번호 <strong class="order-num-text">${orderNumber}</strong><br>
            ${currentTableNumber ? `<span style="font-size:0.9rem; color:#666;">(테이블 ${currentTableNumber}번)</span>` : ''}
            </p>

            ${userInfo.phone !== 'Guest' ? `
            <div style="background:#FFF5F0; padding:12px; border-radius:8px; text-align:center; margin-bottom:20px; border:1px solid #FF6B35;">
                <div style="font-weight:bold; color:#FF6B35;">💰 ${earnedPoints.toLocaleString()}P 적립 완료</div>
                <div style="font-size:0.85rem; color:#666;">(현재 총 포인트: ${currentMember.points.toLocaleString()}P)</div>
            </div>
            ` : ''}

            <!-- 영수증 -->
            <div class="receipt-card">
                 <div class="receipt-header"><h3><span>🧾</span> 전자 영수증</h3><div class="receipt-date">${new Date().toLocaleString()}</div></div>
                 <div class="receipt-items">
                    ${cart.map(i => `<div class="receipt-item"><span>${i.name} x${i.quantity}</span><span>${formatPrice(i.price * i.quantity)}</span></div>`).join('')}
                 </div>
                 <div class="receipt-total"><span>합계</span><span>${formatPrice(cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span></div>
            </div>

            <!-- 네이버 리뷰 -->
            <div class="naver-review-box" onclick="triggerNaverReview()">
                <div style="font-weight:bold; font-size:1.1rem; margin-bottom:4px;"><span class="naver-icon">N</span>네이버 리뷰 쓰고</div>
                <div style="font-size:1.2rem; font-weight:800; color:#fff;">추가 포인트 (+500P) 받기</div>
                <span class="review-benefit">👈 클릭 시 영수증 자동첨부</span>
            </div>

            <div class="complete-actions" style="margin-top: 24px;">
                <button class="btn btn-outline" onclick="restartDemo()">🔄 처음으로</button>
            </div>
        </div>
    `;
    completeSection.classList.remove('hidden');

    // ★★★ 통합 데이터 전송 (테이블 번호 자동 포함) ★★★
    sendDataToOwner('NEW_ORDER', {
        orderNumber,
        items: cart,
        total: cart.reduce((s, i) => s + (i.price * i.quantity), 0),
        timestamp: new Date().toISOString(),
        userInfo
    });
}

// 네이버 리뷰 실제 연동 시뮬레이션
function triggerNaverReview() {
    const btn = document.querySelector('.naver-review-box');

    // 이미 인증 요청을 보낸 경우 중복 방지
    if (btn.classList.contains('auth-sent')) return;

    // A. [인증 요청 모드일 때]: 사장님께 알림 전송 + 포인트 추가 적립
    if (btn.classList.contains('auth-mode')) {
        btn.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;"><span>🚀 전송 중...</span></div>';

        const orderNum = document.querySelector('.order-num-text').textContent || '#Unknown';
        // ★★★ 통합 데이터 전송 ★★★
        sendDataToOwner('REVIEW_VERIFIED', {
            orderNumber: orderNum,
            timestamp: new Date().toISOString()
        });

        // 추가 포인트 적립 시뮬레이션
        if (currentMember && currentMember.phone) {
            MemberDB.addPoint(currentMember.phone, 500); // 리뷰 보상 500P
        }

        setTimeout(() => {
            btn.innerHTML = `<div style="font-size:1.1rem; font-weight:bold;">✅ 인증 완료! (+500P)</div><span style="font-size:0.9rem; opacity:0.9;">포인트가 즉시 적립되었습니다</span>`;
            btn.style.background = '#333';
            btn.classList.add('auth-sent');
            alert("사장님께 리뷰 인증을 보냈습니다!\n리뷰 감사 포인트 500P가 추가 적립되었습니다.");
        }, 800);
        return;
    }

    // B. [초기 상태일 때]: 영수증 저장 및 네이버 이동
    const originalText = btn.innerHTML;

    // 1. 로딩 상태 표시
    btn.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;"><div class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></div><span>영수증 발급 중...</span></div>';
    btn.style.pointerEvents = 'none';

    // 2. 영수증 이미지 캡처
    const receiptCard = document.querySelector('.receipt-card');

    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        script.onload = () => triggerNaverReview();
        document.head.appendChild(script);
        return;
    }

    html2canvas(receiptCard, {
        scale: 2, backgroundColor: '#ffffff', logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `qtable_receipt_${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(3, 199, 90, 0.95); color: white; padding: 24px; border-radius: 16px;
            text-align: center; z-index: 9999; min-width: 300px; box-shadow: 0 15px 40px rgba(0,0,0,0.3);
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        toast.innerHTML = `
            <div style="font-size:2.5rem; margin-bottom:12px;">✅</div>
            <h3 style="margin:0 0 8px 0; font-size:1.3rem;">영수증 저장 완료!</h3>
            <p style="margin:0; font-size:0.95rem; opacity:0.9;">네이버 리뷰 작성 후<br>다시 여기로 돌아오세요!</p>
        `;
        document.body.appendChild(toast);

        if (!document.getElementById('toast-ani')) {
            const style = document.createElement('style');
            style.id = 'toast-ani';
            style.textContent = `@keyframes popIn { from { opacity:0; transform:translate(-50%, -40%) scale(0.9); } to { opacity:1; transform:translate(-50%, -50%) scale(1); } }`;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            const naverUrl = "https://m.place.naver.com/my/review/choose/receipt";
            const newWindow = window.open(naverUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                window.location.href = naverUrl;
            }
            toast.remove();

            btn.classList.add('auth-mode');
            btn.style.pointerEvents = 'auto';
            btn.style.background = '#FF6B35';
            btn.innerHTML = `
                <div style="font-weight:bold; font-size:1.2rem; animation: pulse 1.5s infinite;">🔔 리뷰 올렸어요! (인증)</div>
                <span class="review-benefit" style="background:rgba(0,0,0,0.1);">👈 클릭하면 포인트 적립 & 사장님 알림</span>
            `;
            if (!document.getElementById('pulse-ani')) {
                const s = document.createElement('style');
                s.id = 'pulse-ani';
                s.textContent = `@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }`;
                document.head.appendChild(s);
            }
        }, 2000);

    }).catch(err => {
        console.error('영수증 캡처 실패:', err);
        alert('영수증 저장 실패');
        btn.innerHTML = originalText;
        btn.style.pointerEvents = 'auto';
    });
}

function goBackToMenu() {
    document.getElementById('payment-section').classList.add('hidden');
    updateCartUI();
}

function restartDemo() {
    cart = [];
    document.getElementById('complete-section').classList.add('hidden');
    updateCartUI();
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.8); color: white; padding: 12px 24px; border-radius: 20px;
        z-index: 9999; font-size: 0.9rem;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// 페이지 로드 시 원격 연결 초기화
initRemoteConnection();

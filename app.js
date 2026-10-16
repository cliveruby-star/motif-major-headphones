/**
 * MOTIF Major Lifestyle Landing Page Interactive Controller
 * Features:
 * 1. Product Edition state & Pricing computation (Standard NT$3,990 vs Pro NT$5,990)
 * 2. Three-View Interactive Viewer (Front, Side, Folded)
 * 3. Customer Reviews Interactive System (Dynamic adding, rating selector, filtering)
 * 4. Credit Card In-Page Instant Payment with 3D Flip & Luhn algorithm
 * 5. Official ECPay 綠界科技 Stage AioCheckOut/V5 integration with SHA-256 CheckMacValue
 * 6. Modern Web Guidance compliance: :user-valid/invalid, syncAria, and dialog light-dismiss
 */

// Global State
const appState = {
  selectedEdition: 'pro', // 'standard' | 'pro'
  quantity: 1,
  prices: {
    standard: 3990,
    pro: 5990
  },
  editionNames: {
    standard: '普通版 (Standard Edition)',
    pro: '高階版 (Pro ANC Edition)'
  },
  editionThumbnails: {
    standard: '172724851626581.jpg',
    pro: '172724851626581.jpg'
  },
  activeGateway: 'card', // 'card' | 'ecpay'
  reviewFilter: 'all'
};

// Data: Three Views Content
const threeViewsData = {
  front: {
    title: '對稱均衡正面聲學腔體',
    tag: 'VIEW 01 / 正視圖',
    desc: '極致對稱的人體工學弧形頭帶，結合加厚記憶海綿與親膚蛋白質皮革耳罩。左右聲道完全獨立腔室設計，提供平衡且具穿透力的全頻段立體聲場。',
    bullets: [
      '均勻分佈頭部受力，久戴輕盈零夾耳感',
      '標配可替換式高密度慢回彈記憶海綿耳墊',
      '內置雙波束成形通話麥克風，精準拾取人聲'
    ],
    image: 'view_front.jpg'
  },
  side: {
    title: '經典黑金搖滾方形標誌',
    tag: 'VIEW 02 / 側視圖',
    desc: '經典正方形荔枝皮紋耳罩搭配標誌性 MOTIF 經典標誌。右耳罩下緣配備全能黃銅多向控制鈕（Control Knob），一鍵掌控播放、暫停、曲目切換與音量微調。',
    bullets: [
      '高質感純黃銅銑削多向五維控制搖桿',
      '支援 Type-C 疾速快充與 3.5mm 雙向分享接口',
      '外露式金屬絞線與防拉扯螺旋導線工藝'
    ],
    image: 'view_side.jpg'
  },
  folded: {
    title: '航太金屬口袋化折疊機構',
    tag: 'VIEW 03 / 折疊俯視圖',
    desc: '堅固耐用的精密折疊轉軸結構，耳罩可順暢向內收折至極限小體積。無論放入隨身托特包、風衣口袋或收納硬殼盒，隨時啟程，隨身相伴。',
    bullets: [
      '高強度鑄造金屬摺疊鉸鏈，經 15,000 次耐久測試',
      '緊湊收納體積減縮達 50%，通勤旅途零負擔',
      'Pro 高階版隨附專屬荔枝紋防撞硬質皮質旅行盒'
    ],
    image: 'view_folded.jpg'
  }
};

// Data: Initial User Reviews
let customerReviews = [
  {
    id: 1,
    name: '林映晨 (Chen L.)',
    edition: 'pro',
    editionText: '購買：高階版 (Pro ANC)',
    rating: 5,
    tag: '捷運通勤必備',
    date: '2026/10/12',
    comment: '每天搭文湖線通勤真的被鐵軌聲吵到頭痛，這台高階版 ANC 一開瞬間像進入私人圖書館！音質保留了 MOTIF 招牌的紮實鼓點與人聲厚度，外觀更是百搭任何秋天大衣，極推！'
  },
  {
    id: 2,
    name: '張庭宇 (Marcus T.)',
    edition: 'standard',
    editionText: '購買：普通版 (Standard)',
    rating: 5,
    tag: '續航怪獸',
    date: '2026/10/08',
    comment: '普通版 3990 價格非常親民！續航力真的誇張，買來到現在聽了一個多禮拜都還不需要充電。黃銅五向旋鈕手感一絕，盲操非常直覺，完全不用把手機拿出來。'
  },
  {
    id: 3,
    name: '何詩婷 (Chloe H.)',
    edition: 'pro',
    editionText: '購買：高階版 (Pro ANC)',
    rating: 5,
    tag: '辦公室專注好物',
    date: '2026/09/29',
    comment: '在開放式建築事務所工作，這副耳機是我的救星。配戴感比起上一代輕巧很多，耳罩軟綿綿不壓眼鏡架。空間音訊搭配 LDAC 無損格式，聽古典與爵士樂空間細節超豐富。'
  },
  {
    id: 4,
    name: '楊承哲 (Alex Y.)',
    edition: 'pro',
    editionText: '購買：高階版 (Pro ANC)',
    rating: 5,
    tag: '夜跑漫步質感',
    date: '2026/09/22',
    comment: '晚上下班去大安森林公園散步或慢跑時戴著，通透模式很安心聽得見環境音。耳機在耳朵上很穩固不會晃動，外觀荔枝皮革黑金質感非常好看！'
  },
  {
    id: 5,
    name: '許家瑋 (David K.)',
    edition: 'standard',
    editionText: '購買：普通版 (Standard)',
    rating: 4,
    tag: '高 CP 值首選',
    date: '2026/09/15',
    comment: '3,990 元買到 MOTIF 經典調音很划算。低頻飽滿有彈性，吉他泛音清脆。外觀折疊收納超小，外出攜帶很方便。'
  }
];

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initThreeViews();
  initPricingAndCheckout();
  initReviewsSystem();
  initFaqAccordion();
  initModernWebGuidanceFeatures();
});

/* ========================================================= */
/* 1. Three-View Interactive Gallery                         */
/* ========================================================= */
function initThreeViews() {
  const tabs = document.querySelectorAll('.view-tab-btn');
  const thumbs = document.querySelectorAll('.view-thumb-card');
  const mainImg = document.getElementById('viewMainImg');
  const tagEl = document.getElementById('viewDetailTag');
  const titleEl = document.getElementById('viewDetailTitle');
  const descEl = document.getElementById('viewDetailDesc');
  const bulletsEl = document.getElementById('viewSpecBullets');

  function switchView(viewKey) {
    const data = threeViewsData[viewKey];
    if (!data) return;

    // Update active classes
    tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewKey));
    thumbs.forEach(card => card.classList.toggle('active', card.dataset.view === viewKey));

    // Smooth transition
    mainImg.style.opacity = '0';
    mainImg.style.transform = 'scale(0.96)';

    setTimeout(() => {
      mainImg.src = data.image;
      mainImg.alt = data.title;
      tagEl.textContent = data.tag;
      titleEl.textContent = data.title;
      descEl.textContent = data.desc;

      bulletsEl.innerHTML = data.bullets.map(b => `
        <div class="view-spec-bullet">
          <span class="check-icon">✓</span>
          <span>${b}</span>
        </div>
      `).join('');

      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
    }, 200);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => switchView(thumb.dataset.view));
  });
}

/* ========================================================= */
/* 2. Pricing & Checkout System                             */
/* ========================================================= */
function initPricingAndCheckout() {
  const checkoutDialog = document.getElementById('checkoutDialog');
  const orderSuccessDialog = document.getElementById('orderSuccessDialog');

  // Trigger buttons
  const orderButtons = document.querySelectorAll('.btn-open-checkout');
  orderButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const edition = e.currentTarget.dataset.edition || 'pro';
      openCheckout(edition);
    });
  });

  // Quantity controls
  const qtyMinus = document.getElementById('checkoutQtyMinus');
  const qtyPlus = document.getElementById('checkoutQtyPlus');
  const qtyDisplay = document.getElementById('checkoutQtyDisplay');

  if (qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', () => {
      if (appState.quantity > 1) {
        appState.quantity--;
        qtyDisplay.textContent = appState.quantity;
        updateOrderSummary();
      }
    });

    qtyPlus.addEventListener('click', () => {
      if (appState.quantity < 10) {
        appState.quantity++;
        qtyDisplay.textContent = appState.quantity;
        updateOrderSummary();
      }
    });
  }

  // Edition selector in checkout
  const editionRadios = document.querySelectorAll('input[name="checkoutEditionRadio"]');
  editionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      appState.selectedEdition = e.target.value;
      updateOrderSummary();
    });
  });

  // Gateway toggle
  const gatewayBtns = document.querySelectorAll('.gateway-tab-btn');
  const cardSection = document.getElementById('cardPaymentSection');
  const ecpaySection = document.getElementById('ecpayPaymentSection');

  gatewayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const gw = btn.dataset.gateway;
      appState.activeGateway = gw;
      gatewayBtns.forEach(b => b.classList.toggle('active', b.dataset.gateway === gw));

      if (gw === 'card') {
        cardSection.style.display = 'block';
        ecpaySection.style.display = 'none';
      } else {
        cardSection.style.display = 'none';
        ecpaySection.style.display = 'block';
      }
    });
  });

  // Virtual Credit Card input synchronizer
  initCreditCardInputs();

  // In-Page Checkout Form Submission
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      return;
    }

    if (appState.activeGateway === 'card') {
      processInPageCreditCardPayment();
    } else {
      processEcpayRedirect();
    }
  });

  // Modal Close buttons
  document.querySelectorAll('.modal-close-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dlg = e.target.closest('dialog');
      if (dlg) dlg.close();
    });
  });
}

function openCheckout(edition = 'pro') {
  appState.selectedEdition = edition;
  appState.quantity = 1;

  const radio = document.querySelector(`input[name="checkoutEditionRadio"][value="${edition}"]`);
  if (radio) radio.checked = true;

  const qtyDisplay = document.getElementById('checkoutQtyDisplay');
  if (qtyDisplay) qtyDisplay.textContent = '1';

  updateOrderSummary();

  const dialog = document.getElementById('checkoutDialog');
  dialog.showModal();
}

function updateOrderSummary() {
  const edition = appState.selectedEdition;
  const unitPrice = appState.prices[edition];
  const total = unitPrice * appState.quantity;

  const nameEl = document.getElementById('summaryEditionName');
  const priceEl = document.getElementById('summaryTotalPrice');
  const submitBtnText = document.getElementById('checkoutSubmitBtnText');
  const ecpayTotalNotice = document.getElementById('ecpayTotalNotice');

  if (nameEl) nameEl.textContent = appState.editionNames[edition];
  if (priceEl) priceEl.textContent = `NT$ ${total.toLocaleString()}`;
  if (submitBtnText) submitBtnText.textContent = `確認付款 NT$ ${total.toLocaleString()}`;
  if (ecpayTotalNotice) ecpayTotalNotice.textContent = `NT$ ${total.toLocaleString()}`;
}

// 3D Credit Card Dynamic Formatting & Luhn Algorithm
function initCreditCardInputs() {
  const cardNumInput = document.getElementById('inputCardNumber');
  const cardHolderInput = document.getElementById('inputCardHolder');
  const cardExpInput = document.getElementById('inputCardExp');
  const cardCvcInput = document.getElementById('inputCardCvc');

  const previewCard = document.getElementById('virtualCreditCard');
  const previewNum = document.getElementById('cardPreviewNumber');
  const previewName = document.getElementById('cardPreviewName');
  const previewExp = document.getElementById('cardPreviewExp');

  if (!cardNumInput) return;

  // Auto format 16-digit card number with spaces
  cardNumInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    e.target.value = formatted;
    previewNum.textContent = formatted || '•••• •••• •••• ••••';

    // Luhn algorithm check
    if (val.length === 16) {
      const isLuhnValid = checkLuhn(val);
      if (!isLuhnValid) {
        cardNumInput.setCustomValidity('請輸入有效的信用卡卡號');
      } else {
        cardNumInput.setCustomValidity('');
      }
    } else {
      cardNumInput.setCustomValidity('');
    }
  });

  // Card holder name
  cardHolderInput.addEventListener('input', (e) => {
    previewName.textContent = e.target.value.toUpperCase() || 'YOUR NAME';
  });

  // Card Expiration auto slash MM/YY
  cardExpInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    e.target.value = val;
    previewExp.textContent = val || 'MM/YY';
  });

  // Flip card on CVC focus
  cardCvcInput.addEventListener('focus', () => {
    previewCard.classList.add('flipped');
  });
  cardCvcInput.addEventListener('blur', () => {
    previewCard.classList.remove('flipped');
  });
}

function checkLuhn(cardNo) {
  let sum = 0;
  let alternate = false;
  for (let i = cardNo.length - 1; i >= 0; i--) {
    let n = parseInt(cardNo.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return (sum % 10 === 0);
}

// Process In-Page Simulated Payment
function processInPageCreditCardPayment() {
  const submitBtn = document.getElementById('checkoutSubmitBtn');
  const submitText = document.getElementById('checkoutSubmitBtnText');
  const originalText = submitText.textContent;

  submitBtn.disabled = true;
  submitText.textContent = '安全加密授權中...';

  setTimeout(() => {
    submitBtn.disabled = false;
    submitText.textContent = originalText;

    // Close checkout dialog
    document.getElementById('checkoutDialog').close();

    // Prepare Receipt Data
    const orderNo = 'EC' + Date.now().toString().slice(-8);
    const buyerName = document.getElementById('inputBuyerName').value;
    const buyerPhone = document.getElementById('inputBuyerPhone').value;
    const edition = appState.selectedEdition;
    const total = appState.prices[edition] * appState.quantity;

    document.getElementById('receiptOrderNo').textContent = orderNo;
    document.getElementById('receiptEdition').textContent = `${appState.editionNames[edition]} × ${appState.quantity}`;
    document.getElementById('receiptAmount').textContent = `NT$ ${total.toLocaleString()}`;
    document.getElementById('receiptBuyer').textContent = `${buyerName} (${buyerPhone})`;

    // Open success receipt
    const successDialog = document.getElementById('orderSuccessDialog');
    successDialog.showModal();
    showToast('🎉 信用卡付款成功！訂單已建立');
  }, 1200);
}

/* ========================================================= */
/* 3. Official ECPay 綠界科技 AioCheckOut/V5 Implementation  */
/* ========================================================= */

/**
 * Generates ECPay CheckMacValue using SHA-256 according to ECPay specification:
 * 1. Collect all parameters (excluding CheckMacValue)
 * 2. Sort keys alphabetically (case-insensitive ASCII)
 * 3. Prefix "HashKey=" and suffix "&HashIV="
 * 4. URL encode and replace: %20 -> +, %21 -> !, %2a -> *, %28 -> (, %29 -> )
 * 5. Convert to lowercase
 * 6. Calculate SHA256 hash
 * 7. Convert to uppercase
 */
async function generateEcpayCheckMacValue(params, hashKey, hashIV) {
  // 1 & 2. Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  // 3. Build query string
  let queryParts = [];
  for (const k of sortedKeys) {
    queryParts.push(`${k}=${params[k]}`);
  }
  let rawStr = `HashKey=${hashKey}&${queryParts.join('&')}&HashIV=${hashIV}`;

  // 4. Custom URL encode matching .NET / ECPay
  let encoded = encodeURIComponent(rawStr)
    .replace(/%20/g, '+')
    .replace(/%21/g, '!')
    .replace(/%2a/gi, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');

  // 5. Lowercase
  encoded = encoded.toLowerCase();

  // 6. SHA256 Web Crypto
  const msgUint8 = new TextEncoder().encode(encoded);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // 7. Uppercase
  return hashHex.toUpperCase();
}

async function processEcpayRedirect() {
  const submitBtn = document.getElementById('checkoutSubmitBtn');
  const submitText = document.getElementById('checkoutSubmitBtnText');
  submitBtn.disabled = true;
  submitText.textContent = '前往綠界收銀台...';

  // Official ECPay Stage Credentials
  const ECPAY_URL = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';
  const MerchantID = '2000132'; // 綠界官方測試特店編號
  const HashKey = '5294y06JbISpM5x9';
  const HashIV = 'v77hoKGq4kWxNNIS';

  const total = appState.prices[appState.selectedEdition] * appState.quantity;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const tradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const tradeNo = 'MG' + Date.now().toString().slice(-10);

  const itemName = `MOTIF Major ${appState.editionNames[appState.selectedEdition]} x ${appState.quantity}`;

  const ecpayParams = {
    MerchantID: MerchantID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: total.toString(),
    TradeDesc: encodeURIComponent('MOTIF耳機訂單'),
    ItemName: itemName,
    ReturnURL: window.location.href,
    ChoosePayment: 'Credit',
    EncryptType: '1'
  };

  try {
    const checkMacValue = await generateEcpayCheckMacValue(ecpayParams, HashKey, HashIV);
    ecpayParams.CheckMacValue = checkMacValue;

    // Create dynamic form and submit to ECPay
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = ECPAY_URL;
    form.target = '_blank'; // Open ECPay checkout in a new window/tab for safety

    for (const [key, val] of Object.entries(ecpayParams)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = val;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    showToast('🚀 已在新視窗開啟綠界官方收銀台！');
    submitBtn.disabled = false;
    submitText.textContent = '確認付款 NT$ ' + total.toLocaleString();
  } catch (err) {
    console.error('ECPay generation error', err);
    alert('綠界付款參數產生失敗，請切換至信用卡即時結帳模式體驗！');
    submitBtn.disabled = false;
    submitText.textContent = '確認付款 NT$ ' + total.toLocaleString();
  }
}

/* ========================================================= */
/* 4. Customer Reviews System (Dynamic & Filterable)        */
/* ========================================================= */
function initReviewsSystem() {
  renderReviews();

  // Review Filters
  const filterPills = document.querySelectorAll('.review-filter-pills .filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.reviewFilter = pill.dataset.filter;
      renderReviews();
    });
  });

  // Open Review Dialog
  const openReviewBtn = document.getElementById('btnOpenReviewModal');
  const reviewDialog = document.getElementById('reviewDialog');
  if (openReviewBtn && reviewDialog) {
    openReviewBtn.addEventListener('click', () => {
      reviewDialog.showModal();
    });
  }

  // Interactive Star Selector
  let selectedRating = 5;
  const starIcons = document.querySelectorAll('#starRatingSelect span');
  starIcons.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.rating, 10);
      starIcons.forEach(s => {
        const r = parseInt(s.dataset.rating, 10);
        s.classList.toggle('selected', r <= selectedRating);
      });
    });
  });

  // Submit Review Form
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!reviewForm.checkValidity()) {
        reviewForm.reportValidity();
        return;
      }

      const name = document.getElementById('inputReviewerName').value.trim();
      const edition = document.getElementById('selectReviewEdition').value;
      const tag = document.getElementById('inputReviewTag').value.trim() || '日常推薦';
      const comment = document.getElementById('inputReviewComment').value.trim();

      const newReview = {
        id: Date.now(),
        name: name,
        edition: edition,
        editionText: `購買：${appState.editionNames[edition]}`,
        rating: selectedRating,
        tag: tag,
        date: '剛剛 (2026/10/16)',
        comment: comment
      };

      customerReviews.unshift(newReview);
      renderReviews();
      reviewForm.reset();
      reviewDialog.close();
      showToast('🌟 感謝您的真實回饋！評價已成功刊登');
    });
  }
}

function renderReviews() {
  const container = document.getElementById('reviewsGrid');
  if (!container) return;

  let filtered = customerReviews;
  if (appState.reviewFilter === 'pro') {
    filtered = customerReviews.filter(r => r.edition === 'pro');
  } else if (appState.reviewFilter === 'standard') {
    filtered = customerReviews.filter(r => r.edition === 'standard');
  }

  container.innerHTML = filtered.map(r => `
    <article class="review-card">
      <div class="review-card-header">
        <div class="reviewer-info">
          <div class="reviewer-avatar">${r.name.charAt(0)}</div>
          <div class="reviewer-meta">
            <h5>${r.name} <span class="verified-badge">✓ 已驗證購買</span></h5>
            <div class="review-edition-tag">${r.editionText}</div>
          </div>
        </div>
        <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      </div>
      <p class="review-content">${r.comment}</p>
      <div class="review-tag-list">
        <span class="review-tag"># ${r.tag}</span>
      </div>
      <div class="review-date">${r.date}</div>
    </article>
  `).join('');
}

/* ========================================================= */
/* 5. FAQ Accordion                                          */
/* ========================================================= */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

/* ========================================================= */
/* 6. Modern Web Guidance Compliance Utilities              */
/* ========================================================= */
function initModernWebGuidanceFeatures() {
  // A. Dialog Light-Dismiss Fallback (for browsers lacking closedby support)
  const dialogs = document.querySelectorAll('dialog');
  dialogs.forEach(dialog => {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) {
          dialog.close();
        }
      });
    }
  });

  // B. Consistent ARIA Experience with :user-invalid
  const syncAria = (el) => {
    if (el && typeof el.setAttribute === 'function') {
      try {
        el.setAttribute('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false');
      } catch (err) {
        // Fallback for older selector engine
      }
    }
  };

  document.addEventListener('blur', (e) => syncAria(e.target), true);
  document.addEventListener('input', (e) => {
    if (e.target.hasAttribute && e.target.hasAttribute('aria-invalid')) {
      syncAria(e.target);
    }
  });
}

/* Toast Message Helper */
function showToast(msg) {
  const toast = document.getElementById('toastNotice');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

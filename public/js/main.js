const API_BASE_URL = 'https://solobmen.onrender.com';

// Состояние приложения
let rate = getRandomRate();
let balances = {
  sol: 0,
  usdt: 0
};

// DOM элементы
const elements = {
  rateDisplay: document.getElementById('rate'),
  depositBtn: document.getElementById('depositBtn'),
  withdrawSolBtn: document.getElementById('withdrawSolBtn'),
  withdrawUsdtBtn: document.getElementById('withdrawUsdtBtn'),
  buySolBtn: document.getElementById('buySolBtn'),
  sellSolBtn: document.getElementById('sellSolBtn'),
  buyUsdtBtn: document.getElementById('buyUsdtBtn'),
  sellUsdtBtn: document.getElementById('sellUsdtBtn'),
  solBalanceDisplay: document.getElementById('solBalance'),
  usdtBalanceDisplay: document.getElementById('usdtBalance'),
  captchaModal: document.getElementById('captchaModal'),
  captchaForm: document.getElementById('captchaForm'),
  captchaAnswer: document.getElementById('captchaAnswer'),
  captchaQuestion: document.getElementById('captchaQuestion')
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  startRateUpdates();
});

function getRandomRate() {
  return (Math.random() * (178.02 - 160.03) + 160.03).toFixed(2);
}

function initApp() {
  setupEventListeners();
  updateUI();
  
  // Проверяем localStorage для балансов
  const savedBalances = JSON.parse(localStorage.getItem('balances'));
  if (savedBalances) {
    balances = savedBalances;
    updateBalances();
  }
  
  // Показываем капчу если не пройдена
  if (!localStorage.getItem('captchaPassed')) {
    showCaptcha();
  }
}

function setupEventListeners() {
  // Кнопки операций
  elements.depositBtn?.addEventListener('click', handleDeposit);
  elements.withdrawSolBtn?.addEventListener('click', () => handleWithdraw('sol'));
  elements.withdrawUsdtBtn?.addEventListener('click', () => handleWithdraw('usdt'));
  elements.buySolBtn?.addEventListener('click', () => handleTrade('buy', 'sol'));
  elements.sellSolBtn?.addEventListener('click', () => handleTrade('sell', 'sol'));
  elements.buyUsdtBtn?.addEventListener('click', () => handleTrade('buy', 'usdt'));
  elements.sellUsdtBtn?.addEventListener('click', () => handleTrade('sell', 'usdt'));
  
  // Капча
  elements.captchaForm?.addEventListener('submit', handleCaptchaSubmit);
  
  // Закрытие модальных окон
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
      });
    });
  });
}

function updateUI() {
  updateBalances();
  
  if (elements.rateDisplay) {
    elements.rateDisplay.textContent = `${rate} USDT`;
  }
}

function updateBalances() {
  if (elements.solBalanceDisplay) {
    elements.solBalanceDisplay.textContent = balances.sol.toFixed(4);
  }
  if (elements.usdtBalanceDisplay) {
    elements.usdtBalanceDisplay.textContent = balances.usdt.toFixed(2);
  }
  localStorage.setItem('balances', JSON.stringify(balances));
}

// Обработчики действий
function handleDeposit() {
  showModal('depositModal');
}

function handleWithdraw(currency) {
  if (balances[currency] <= 0) {
    showToast(`You don't have enough ${currency.toUpperCase()} to withdraw`);
    return;
  }
  showModal(`${currency}WithdrawModal`);
}

function handleTrade(action, currency) {
  const baseCurrency = currency === 'sol' ? 'USDT' : 'SOL';
  const targetCurrency = currency === 'sol' ? 'SOL' : 'USDT';
  
  if (action === 'buy' && balances[currency === 'sol' ? 'usdt' : 'sol'] <= 0) {
    showToast(`You need to deposit ${baseCurrency} to buy ${targetCurrency}`);
    return;
  }
  
  if (action === 'sell' && balances[currency] <= 0) {
    showToast(`You don't have enough ${targetCurrency} to sell`);
    return;
  }
  
  showModal(`${action}${currency}Modal`);
}

async function handleCaptchaSubmit(e) {
  e.preventDefault();
  const answer = elements.captchaAnswer.value.trim();
  
  if (answer === "12") {
    localStorage.setItem('captchaPassed', 'true');
    showToast('Verification successful!');
    elements.captchaModal.classList.add('hidden');
  } else {
    showToast('Wrong answer, try again', 'error');
  }
}

// Вспомогательные функции
function showModal(modalId) {
  document.getElementById(modalId)?.classList.remove('hidden');
}

function showCaptcha() {
  if (elements.captchaModal) {
    elements.captchaModal.classList.remove('hidden');
    if (elements.captchaQuestion) {
      elements.captchaQuestion.textContent = "What is 6 + 6?";
    }
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Обновление курса
function startRateUpdates() {
  updateRate();
  setInterval(updateRate, 5000);
}

function updateRate() {
  rate = getRandomRate();
  if (elements.rateDisplay) {
    elements.rateDisplay.textContent = `${rate} USDT`;
  }
}
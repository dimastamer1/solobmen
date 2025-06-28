// Конфигурация
const API_BASE_URL = 'https://solobmen.onrender.com';

// Состояние приложения
let rate = getRandomRate();
let captchaPassed = localStorage.getItem('captchaPassed') === 'true' || false;

// DOM элементы
const elements = {
  captchaModal: document.getElementById('captchaModal'),
  captchaForm: document.getElementById('captchaForm'),
  captchaAnswer: document.getElementById('captchaAnswer'),
  captchaQuestion: document.getElementById('captchaQuestion'),
  totalPasses: document.getElementById('totalPasses'),
  rateDisplay: document.getElementById('rate'),
  depositBtn: document.getElementById('depositBtn')
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  startRateUpdates();
});

// Основные функции
function getRandomRate() {
  return (Math.random() * (178.02 - 160.03) + 160.03).toFixed(2);
}

function initApp() {
  setupEventListeners();
  updateUI();
  
  // Показываем капчу если не пройдена
  if (!captchaPassed) {
    showCaptcha();
  }
  
  // Загружаем статистику
  updateStats();
}

function updateUI() {
  // Всегда показываем основной контент
  document.querySelectorAll('.auth-only, .guest-only').forEach(el => {
    el.style.display = 'block';
  });
  
  if (elements.rateDisplay) {
    elements.rateDisplay.textContent = `${rate} USDT`;
  }
}

function setupEventListeners() {
  // Форма капчи
  if (elements.captchaForm) {
    elements.captchaForm.addEventListener('submit', handleCaptchaSubmit);
  }
  
  // Кнопка депозита
  if (elements.depositBtn) {
    elements.depositBtn.addEventListener('click', () => {
      window.location.href = '/deposit';
    });
  }
  
  // Закрытие модальных окон
  const closeModalButtons = document.querySelectorAll('.close-modal');
  closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (elements.captchaModal) elements.captchaModal.classList.add('hidden');
    });
  });
  
  // Клик вне модального окна
  window.addEventListener('click', (e) => {
    if (elements.captchaModal && e.target === elements.captchaModal) {
      elements.captchaModal.classList.add('hidden');
    }
  });
}

// Обработчики капчи
async function handleCaptchaSubmit(e) {
  e.preventDefault();
  
  const answer = elements.captchaAnswer.value.trim();
  
  try {
    const response = await fetch(`${API_BASE_URL}/captcha/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer })
    });

    const data = await response.json();

    if (data.success) {
      captchaPassed = true;
      localStorage.setItem('captchaPassed', 'true');
      showToast('Captcha passed!');
      if (elements.captchaModal) elements.captchaModal.classList.add('hidden');
      updateStats();
    } else {
      showToast(data.message || 'Wrong answer', 'error');
    }
  } catch (error) {
    console.error('Captcha error:', error);
    showToast('Connection error', 'error');
  }
}

async function updateStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/captcha/stats`);
    const data = await response.json();
    
    if (data.success && elements.totalPasses) {
      elements.totalPasses.textContent = data.totalPasses;
    }
  } catch (error) {
    console.error('Failed to get stats:', error);
  }
}

function showCaptcha() {
  if (elements.captchaModal) {
    elements.captchaModal.classList.remove('hidden');
    if (elements.captchaQuestion) {
      elements.captchaQuestion.textContent = "What is 6 + 6?";
    }
  }
}

// Функции для работы с курсом
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

// Вспомогательные функции
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
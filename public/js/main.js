// Конфигурация
const API_BASE_URL = 'https://solobmen.onrender.com';

// Состояние приложения
let rate = getRandomRate();
let user = JSON.parse(localStorage.getItem('user')) || null;

// DOM элементы
const elements = {
  // Auth elements
  loginBtn: document.getElementById('loginBtn'),
  registerBtn: document.getElementById('registerBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  usernameDisplay: document.getElementById('usernameDisplay'),
  
  // UI elements
  authButtons: document.getElementById('authButtons'),
  userInfo: document.getElementById('userInfo'),
  welcomeContent: document.getElementById('welcomeContent'),
  userContent: document.getElementById('userContent'),
  loginModal: document.getElementById('loginModal'),
  registerModal: document.getElementById('registerModal'),
  depositBtn: document.getElementById('depositBtn'),
  solBalance: document.getElementById('solBalance'),
  usdtBalance: document.getElementById('usdtBalance'),
  rateDisplay: document.getElementById('rate')
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
}

function updateUI() {
  if (user) {
    // Показываем элементы для авторизованных пользователей
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = 'block';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
      el.style.display = 'none';
    });
    
    // Обновляем информацию пользователя
    if (elements.usernameDisplay) {
      elements.usernameDisplay.textContent = user.username;
    }
    if (elements.solBalance) {
      elements.solBalance.textContent = user.solBalance.toFixed(4);
    }
    if (elements.usdtBalance) {
      elements.usdtBalance.textContent = user.usdtBalance.toFixed(2);
    }
    if (elements.rateDisplay) {
      elements.rateDisplay.textContent = `${rate} USDT`;
    }
  } else {
    // Показываем элементы для гостей
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
      el.style.display = 'block';
    });
  }
}

function setupEventListeners() {
  // Кнопки авторизации
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', () => {
      if (elements.loginModal) elements.loginModal.classList.remove('hidden');
    });
  }
  
  if (elements.registerBtn) {
    elements.registerBtn.addEventListener('click', () => {
      if (elements.registerModal) elements.registerModal.classList.remove('hidden');
    });
  }
  
  // Формы
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', handleLogin);
  }
  
  if (elements.registerForm) {
    elements.registerForm.addEventListener('submit', handleRegister);
  }
  
  // Кнопка выхода
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Закрытие модальных окон
  const closeModalButtons = document.querySelectorAll('.close-modal');
  closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (elements.loginModal) elements.loginModal.classList.add('hidden');
      if (elements.registerModal) elements.registerModal.classList.add('hidden');
    });
  });
  
  // Клик вне модального окна
  window.addEventListener('click', (e) => {
    if (elements.loginModal && e.target === elements.loginModal) {
      elements.loginModal.classList.add('hidden');
    }
    if (elements.registerModal && e.target === elements.registerModal) {
      elements.registerModal.classList.add('hidden');
    }
  });
  
  // Кнопка депозита
  if (elements.depositBtn) {
    elements.depositBtn.addEventListener('click', () => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/deposit';
      }
    });
  }
}

// Обработчики авторизации
async function handleLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(elements.loginForm);
  const credentials = {
    username: formData.get('username'),
    password: formData.get('password')
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      user = data.user;
      localStorage.setItem('user', JSON.stringify(user));
      updateUI();
      showToast('Login successful!');
      if (elements.loginModal) elements.loginModal.classList.add('hidden');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Connection error', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const formData = new FormData(elements.registerForm);
  const userData = {
    username: formData.get('username'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirm_password')
  };

  if (userData.password !== userData.confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password
      }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      user = data.user;
      localStorage.setItem('user', JSON.stringify(user));
      updateUI();
      showToast('Registration successful! You received 0.5 SOL + 10 USDT bonus!');
      if (elements.registerModal) elements.registerModal.classList.add('hidden');
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Connection error', 'error');
  }
}

async function handleLogout() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      user = null;
      localStorage.removeItem('user');
      updateUI();
      showToast('Logged out successfully');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed', 'error');
  }
}

// Функции для работы с курсом
function startRateUpdates() {
  updateRate();
  setInterval(updateRate, 5000);
}

function updateRate() {
  rate = getRandomRate();
  if (user && elements.rateDisplay) {
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
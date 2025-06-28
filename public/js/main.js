// Конфигурация
const API_BASE_URL = process.env.API_BASE_URL || '';
let rate = getRandomRate();
let user = JSON.parse(localStorage.getItem('user')) || null;

// DOM элементы
const authElements = {
  loginBtn: document.getElementById('loginBtn'),
  registerBtn: document.getElementById('registerBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  usernameDisplay: document.getElementById('usernameDisplay'),
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

// Функции
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
    if (authElements.usernameDisplay) {
      authElements.usernameDisplay.textContent = user.username;
    }
    if (authElements.authButtons) authElements.authButtons.classList.add('hidden');
    if (authElements.userInfo) authElements.userInfo.classList.remove('hidden');
    if (authElements.welcomeContent) authElements.welcomeContent.classList.add('hidden');
    if (authElements.userContent) authElements.userContent.classList.remove('hidden');
    
    // Обновляем балансы
    if (authElements.solBalance) authElements.solBalance.textContent = user.solBalance ? user.solBalance.toFixed(4) : '0.0000';
    if (authElements.usdtBalance) authElements.usdtBalance.textContent = user.usdtBalance ? user.usdtBalance.toFixed(2) : '0.00';
    if (authElements.rateDisplay) authElements.rateDisplay.textContent = `${rate} USDT`;
  } else {
    // Показываем элементы для гостей
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
      el.style.display = 'block';
    });
    
    if (authElements.authButtons) authElements.authButtons.classList.remove('hidden');
    if (authElements.userInfo) authElements.userInfo.classList.add('hidden');
    if (authElements.welcomeContent) authElements.welcomeContent.classList.remove('hidden');
    if (authElements.userContent) authElements.userContent.classList.add('hidden');
  }
}

function setupEventListeners() {
  // Кнопки авторизации/регистрации
  if (authElements.loginBtn) {
    authElements.loginBtn.addEventListener('click', () => {
      if (authElements.loginModal) authElements.loginModal.classList.remove('hidden');
    });
  }
  
  if (authElements.registerBtn) {
    authElements.registerBtn.addEventListener('click', () => {
      if (authElements.registerModal) authElements.registerModal.classList.remove('hidden');
    });
  }
  
  // Кнопка выхода
  if (authElements.logoutBtn) {
    authElements.logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Закрытие модальных окон
  const closeModalButtons = document.querySelectorAll('.close-modal');
  closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (authElements.loginModal) authElements.loginModal.classList.add('hidden');
      if (authElements.registerModal) authElements.registerModal.classList.add('hidden');
    });
  });
  
  // Клик вне модального окна
  window.addEventListener('click', (e) => {
    if (authElements.loginModal && e.target === authElements.loginModal) {
      authElements.loginModal.classList.add('hidden');
    }
    if (authElements.registerModal && e.target === authElements.registerModal) {
      authElements.registerModal.classList.add('hidden');
    }
  });
  
  // Формы
  if (authElements.loginForm) {
    authElements.loginForm.addEventListener('submit', handleLogin);
  }
  
  if (authElements.registerForm) {
    authElements.registerForm.addEventListener('submit', handleRegister);
  }
  
  // Кнопка депозита
  if (authElements.depositBtn) {
    authElements.depositBtn.addEventListener('click', () => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/deposit';
      }
    });
  }
}

// Обработка входа
async function handleLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(authElements.loginForm);
  const credentials = {
    username: formData.get('username'),
    password: formData.get('password')
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      user = data.user;
      localStorage.setItem('user', JSON.stringify(user));
      updateUI();
      showToast('Login successful!');
      if (authElements.loginModal) authElements.loginModal.classList.add('hidden');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Connection error', 'error');
  }
}

// Обработка регистрации
async function handleRegister(e) {
  e.preventDefault();
  
  const formData = new FormData(authElements.registerForm);
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
      headers: { 'Content-Type': 'application/json' },
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
      if (authElements.registerModal) authElements.registerModal.classList.add('hidden');
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Connection error', 'error');
  }
}

// Обработка выхода
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

// Обновление курса
function startRateUpdates() {
  updateRate();
  setInterval(updateRate, 5000);
}

function updateRate() {
  rate = getRandomRate();
  if (user && authElements.rateDisplay) {
    authElements.rateDisplay.textContent = `${rate} USDT`;
  }
}

// Вспомогательная функция для уведомлений
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
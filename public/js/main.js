// Состояние приложения
let rate = getRandomRate();
let user = JSON.parse(sessionStorage.getItem('user')) || null;

// DOM элементы
const authButtons = document.getElementById('authButtons');
const userInfo = document.getElementById('userInfo');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeContent = document.getElementById('welcomeContent');
const userContent = document.getElementById('userContent');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeModalButtons = document.querySelectorAll('.close-modal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const depositBtn = document.getElementById('depositBtn');

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  setupEventListeners();
  startRateUpdates();
});

// Функции
function getRandomRate() {
  return (Math.random() * (178.02 - 160.03) + 160.03).toFixed(2);
}

function updateUI() {
  if (user) {
    authButtons.classList.add('hidden');
    userInfo.classList.remove('hidden');
    usernameDisplay.textContent = user.username;
    welcomeContent.classList.add('hidden');
    userContent.classList.remove('hidden');
    
    // Обновляем балансы
    document.getElementById('solBalance').textContent = user.solBalance.toFixed(4);
    document.getElementById('usdtBalance').textContent = user.usdtBalance.toFixed(2);
    document.getElementById('rate').textContent = `${rate} USDT`;
  } else {
    authButtons.classList.remove('hidden');
    userInfo.classList.add('hidden');
    welcomeContent.classList.remove('hidden');
    userContent.classList.add('hidden');
  }
}

function setupEventListeners() {
  // Кнопки авторизации/регистрации
  loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
  registerBtn.addEventListener('click', () => registerModal.classList.remove('hidden'));
  logoutBtn.addEventListener('click', handleLogout);
  
  // Закрытие модальных окон
  closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      loginModal.classList.add('hidden');
      registerModal.classList.add('hidden');
    });
  });
  
  // Клик вне модального окна
  window.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.classList.add('hidden');
    if (e.target === registerModal) registerModal.classList.add('hidden');
  });
  
  // Формы
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  
  // Депозит
  if (depositBtn) {
    depositBtn.addEventListener('click', () => {
      // Сохраняем данные пользователя в sessionStorage для депозит страницы
      sessionStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/deposit';
    });
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get('username');
  const password = formData.get('password');
  
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      user = data.user;
      sessionStorage.setItem('user', JSON.stringify(user));
      updateUI();
      loginModal.classList.add('hidden');
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Server error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const formData = new FormData(registerForm);
  const username = formData.get('username');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirm_password');
  
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      user = data.user;
      sessionStorage.setItem('user', JSON.stringify(user));
      updateUI();
      registerModal.classList.add('hidden');
      alert(`Welcome! You received 0.5 SOL and 10 USDT as a registration bonus.`);
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Server error');
  }
}

async function handleLogout() {
  try {
    const response = await fetch('/auth/logout', {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (data.success) {
      user = null;
      sessionStorage.removeItem('user');
      updateUI();
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function startRateUpdates() {
  updateRate();
  setInterval(updateRate, 5000);
}

function updateRate() {
  rate = getRandomRate();
  if (user) {
    document.getElementById('rate').textContent = `${rate} USDT`;
  }
}

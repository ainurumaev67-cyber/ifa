import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAffcR41eZ8Cfpo2S4StX-r8VYy_j5PLsc",
  authDomain: "ifa-a2b2f.firebaseapp.com",
  projectId: "ifa-a2b2f",
  storageBucket: "ifa-a2b2f.firebasestorage.app",
  messagingSenderId: "990599772621",
  appId: "1:990599772621:web:8b683a6d0e0ec52ea66c84",
  measurementId: "G-MQ3NC98DPR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const userInfo = document.getElementById('user-info');
const dashboardLink = document.getElementById('dashboard-link');
const logoutBtn = document.getElementById('logout-btn');
const authBlock = document.getElementById('auth-block');

// Отслеживание состояния входа
onAuthStateChanged(auth, user => {
  if (user) {
    if (authBlock) authBlock.style.display = 'none';
    if (userInfo) userInfo.textContent = `Привет, ${user.email}`;
    if (dashboardLink) dashboardLink.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (authBlock) authBlock.style.display = 'block';
    if (userInfo) userInfo.textContent = '';
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
});

// Кнопка входа
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      alert('Введите email и пароль');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      alert('Ошибка входа: ' + e.message);
    }
  });
}

// Кнопка регистрации
if (registerBtn) {
  registerBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      alert('Введите email и пароль');
      return;
    }
    if (password.length < 6) {
      alert('Пароль должен быть не менее 6 символов');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      alert('Ошибка регистрации: ' + e.message);
    }
  });
}

// Кнопка выхода
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
  });
}

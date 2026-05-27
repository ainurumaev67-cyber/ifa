import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById('login-btn');
const userInfo = document.getElementById('user-info');
const dashboardLink = document.getElementById('dashboard-link');
const logoutBtn = document.getElementById('logout-btn');

// Отслеживание состояния входа
onAuthStateChanged(auth, user => {
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) userInfo.textContent = `Привет, ${user.displayName}`;
    if (dashboardLink) dashboardLink.style.display = 'inline-block';
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userInfo) userInfo.textContent = '';
    if (dashboardLink) dashboardLink.style.display = 'none';
  }
});

// Кнопка входа
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      alert('Ошибка входа: ' + e.message);
    }
  });
}

// Кнопка выхода
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
  });
}
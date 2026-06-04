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

const btnLoginMenu = document.getElementById('btn-login-menu');
const btnDashboard = document.getElementById('btn-dashboard');
const btnDocs = document.getElementById('btn-docs');
const btnAccount = document.getElementById('btn-account');
const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');

function switchSection(name) {
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-' + name).classList.add('active');
    const menuBtn = document.querySelector(`.sidebar-btn[data-section="${name}"]`);
    if (menuBtn) menuBtn.classList.add('active');
}

onAuthStateChanged(auth, user => {
    if (user) {
        btnLoginMenu.classList.add('hidden');
        btnDashboard.classList.remove('hidden');
        btnDocs.classList.remove('hidden');
        btnAccount.classList.remove('hidden');
        userInfo.textContent = '👋 ' + user.email;
        logoutBtn.style.display = 'inline-block';
    } else {
        btnLoginMenu.classList.remove('hidden');
        btnDashboard.classList.add('hidden');
        btnDocs.classList.add('hidden');
        btnAccount.classList.add('hidden');
        userInfo.textContent = 'Вы не вошли.';
        logoutBtn.style.display = 'none';
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
        switchSection('dashboard');
    } catch(e) { alert('Ошибка: ' + e.message); }
});

document.getElementById('register-btn').addEventListener('click', async () => {
    try {
        await createUserWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
        switchSection('dashboard');
    } catch(e) { alert('Ошибка: ' + e.message); }
});

logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    switchSection('home');
});

// Переключение разделов по кнопкам меню
document.querySelectorAll('.sidebar-btn[data-section]').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

function showToast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'ifa-toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
}

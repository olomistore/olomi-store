import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { showNotification } from './utils.js';

// --- LÓGICA DE LOGIN PARA O PAINEL DE ADMIN ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value.trim();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const roleRef = doc(db, 'roles', user.uid);
            const docSnap = await getDoc(roleRef);

            if (docSnap.exists() && docSnap.data().admin) {
                window.location.href = 'admin.html';
            } else {
                await signOut(auth);
                alert('Acesso negado. Esta área é apenas para administradores.');
            }
        } catch (err) {
            console.error("Erro ao entrar:", err);
            alert('Erro ao entrar: Verifique o seu e-mail e senha.');
        }
    });
}

// --- LÓGICA DE PROTEÇÃO DE PÁGINA DE ADMIN ---
export async function requireAdmin() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                const roleRef = doc(db, 'roles', user.uid);
                const docSnap = await getDoc(roleRef);
                if (docSnap.exists() && docSnap.data().admin) {
                    resolve(user);
                } else {
                    window.location.href = 'login.html';
                    reject(new Error('Acesso não autorizado'));
                }
            } else {
                window.location.href = 'login.html';
                reject(new Error('Utilizador não autenticado'));
            }
        });
    });
}

// --- LÓGICA DE LOGOUT ---
const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        });
    });
}

// --- LÓGICA PARA RECUPERAR SENHA ---
const resetPasswordLink = document.getElementById('reset-password-link');
if (resetPasswordLink) {
    resetPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt("Por favor, insira o seu e-mail para recuperar a senha:");
        if (email) {
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    showNotification('Link de recuperação enviado para o seu e-mail!', 'success');
                })
                .catch((error) => {
                    console.error("Erro ao enviar e-mail de recuperação:", error);
                    showNotification('Erro ao enviar e-mail. Verifique se o e-mail está correto.', 'error');
                });
        }
    });
}


// ==================================================================
// ✅ CÓDIGO CORRIGIDO ABAIXO
// ==================================================================

// --- LÓGICA PARA ATUALIZAR A NAVEGAÇÃO DO UTILIZADOR (CABEÇALHO) ---
async function updateUserNav(user) {
    const adminLinkContainer = document.getElementById('admin-link-container');
    const userNav = document.getElementById('user-navigation');

    // Limpa a navegação para evitar duplicados
    if (adminLinkContainer) adminLinkContainer.innerHTML = '';
    if (userNav) userNav.innerHTML = '';

    if (user) {
        // Se o utilizador estiver autenticado
        // 1. Verifica se é administrador (e AGUARDA a resposta)
        const roleRef = doc(db, 'roles', user.uid);
        const snap = await getDoc(roleRef); // Usa await para esperar a resposta
        if (snap.exists() && snap.data().admin) {
            if (adminLinkContainer) {
                adminLinkContainer.innerHTML = `<a href="admin.html" class="cart-link admin-link">Painel Admin</a>`;
            }
        }

        // 2. Mostra a navegação do cliente ("Minha Conta", "Sair")
        if (userNav) {
            userNav.innerHTML = `
                <a href="minha-conta.html" class="cart-link">Minha Conta</a>
                <button id="logout-cliente-auth" class="logout-btn">Sair</button>
            `;
            const logoutButton = document.getElementById('logout-cliente-auth');
            if (logoutButton) {
                logoutButton.addEventListener('click', () => {
                    signOut(auth);
                });
            }
        }
    } else {
        // Se o utilizador não estiver autenticado
        if (userNav) {
            userNav.innerHTML = `
                <a href="login-cliente.html" class="cart-link">Entrar</a>
                <a href="cadastro.html" class="cart-link">Registar</a>
            `;
        }
    }
}

// Configura o "ouvinte" de autenticação que atualiza o cabeçalho sempre que o estado de login muda
onAuthStateChanged(auth, (user) => {
    updateUserNav(user);
});
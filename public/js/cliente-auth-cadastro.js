import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// --- ELEMENTOS DO DOM ---
const loginClienteForm = document.getElementById('login-cliente-form');
const adminLinkContainer = document.getElementById('admin-link-container');
const userNav = document.getElementById('user-navigation');

// --- LÓGICA DO FORMULÁRIO DE LOGIN DO CLIENTE ---
if (loginClienteForm) {
    loginClienteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginClienteForm.email.value.trim();
        const password = loginClienteForm.password.value.trim();
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get('redirect');
            window.location.href = redirectUrl || 'index.html';

        } catch (err) {
            console.error("Erro ao entrar:", err);
            alert('Erro ao entrar: Verifique o seu e-mail e senha.');
        }
    });
}

// --- FUNÇÃO CORRIGIDA PARA ATUALIZAR A NAVEGAÇÃO (CABEÇALHO) ---
// Esta função agora é 'async' e usa 'await' para garantir que a verificação de admin termine antes de continuar.
async function updateUserNav(user) {
    // Limpa o conteúdo atual para evitar duplicados
    if (adminLinkContainer) adminLinkContainer.innerHTML = '';
    if (userNav) userNav.innerHTML = '';

    if (user) {
        // 1. O usuário está logado. Tenta verificar se é admin.
        try {
            const roleRef = doc(db, 'roles', user.uid);
            const snap = await getDoc(roleRef); // USA 'AWAIT' PARA ESPERAR A RESPOSTA
            if (snap.exists() && snap.data().admin) {
                if (adminLinkContainer) {
                    adminLinkContainer.innerHTML = `<a href="admin.html" class="cart-link admin-link">Painel Admin</a>`;
                }
            }
        } catch (error) {
            console.error("Erro ao verificar a função de admin:", error);
        }

        // 2. Monta a navegação de usuário logado ("Minha Conta", "Sair")
        if (userNav) {
            userNav.innerHTML = `
                <a href="minha-conta.html" class="cart-link">Minha Conta</a>
                <button id="logout-cliente" class="logout-btn">Sair</button>
            `;
            // Adiciona o evento de clique ao botão de logout
            const logoutButton = document.getElementById('logout-cliente');
            if (logoutButton) {
                logoutButton.addEventListener('click', () => {
                    signOut(auth).catch(err => console.error("Erro ao sair:", err));
                });
            }
        }
    } else {
        // 3. O usuário NÃO está logado. Mostra os links "Entrar" e "Registar".
        if (userNav) {
            userNav.innerHTML = `
                <a href="login-cliente.html" class="cart-link">Entrar</a>
                <a href="cadastro.html" class="cart-link">Registar</a>
            `;
        }
    }
}

// --- OBSERVADOR DE AUTENTICAÇÃO ---
// Este código ouve qualquer mudança no estado de login (entrar, sair) e chama a função para atualizar o cabeçalho.
onAuthStateChanged(auth, (user) => {
    updateUserNav(user);
});
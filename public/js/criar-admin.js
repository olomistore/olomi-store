import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { showNotification } from './utils.js';

const form = document.getElementById('create-admin-form');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = form.querySelector('button');
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value.trim();
        const confirmPassword = form.confirmPassword.value.trim();

        if (password !== confirmPassword) {
            showNotification('As senhas não coincidem. Por favor, tente novamente.', 'error');
            return;
        }
        if (password.length < 6) {
            showNotification('A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'A criar...';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ==================================================================
            // ✅ CÓDIGO CORRIGIDO ABAIXO
            // ==================================================================
            // Salva um documento de usuário com a estrutura completa para consistência
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: email,
                phone: '', // Adiciona campo de telefone vazio
                address: { // Adiciona objeto de endereço vazio
                    cep: '',
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: ''
                },
                createdAt: serverTimestamp()
            });

            // Adiciona a "role" de admin em uma coleção separada
            await setDoc(doc(db, 'roles', user.uid), {
                admin: true
            });

            showNotification(`Administrador ${name} criado com sucesso!`, 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);

        } catch (err) {
            console.error("Erro ao criar administrador:", err);
            let errorMessage = 'Ocorreu um erro ao criar o administrador.';
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está a ser utilizado por outra conta.';
            }
            showNotification(errorMessage, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Administrador';
        }
    });
}
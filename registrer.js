const API_URL = 'https://projecttasks.onrender.com';

async function registerUser() {
    const user = document.getElementById('user').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validações
    if (!user || !password) {
        alert('Preencha todos os campos.');
        return;
    }

    if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }

    if (password.length < 6) {
        alert('Senha deve ter no mínimo 6 caracteres.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,
                senha: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Erro ao registrar usuário.');
            return;
        }

        alert('Registrado com sucesso! Faça login agora.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao registrar:', error);
        alert('Erro de conexão. Tente novamente.');
    }
}


function togglemode() {
    const html = document.documentElement;
    html.classList.toggle("dark");

    if (html.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
}

// Carrega o tema salvo quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem("theme");
    
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
});

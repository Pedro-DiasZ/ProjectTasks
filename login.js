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




const API_URL = 'https://projecttasks.onrender.com';

async function loginUser() {
    const user = document.getElementById('user').value.trim();
    const password = document.getElementById('password').value;

    // Validações
    if (!user || !password) {
        alert('Preencha usuário e senha.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,
                senha: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro no login:', data);
            alert(data.error || 'Usuário ou senha incorretos.');
            return;
        }

        console.log('Login bem-sucedido!', data);
        
        // Validar se o token foi retornado
        if (!data.access_token) {
            console.error('Servidor não retornou token:', data);
            alert('Erro: servidor não retornou token de autenticação');
            return;
        }

        // Armazena token e nome de usuário
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('loginStorage', user);
        
        console.log('Token salvo:', localStorage.getItem('token'));
        console.log('Usuário salvo:', localStorage.getItem('loginStorage'));
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro de conexão. Tente novamente.');
    }
}

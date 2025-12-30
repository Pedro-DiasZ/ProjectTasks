

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




function loginUser() {
    const user = document.getElementById('user').value;
    const password = document.getElementById('password').value;

    const storedUser = localStorage.getItem("loginStorage");
    const storedPassword = localStorage.getItem("passwordStorage");

    if (user === storedUser && password === storedPassword) {
        window.location.href = 'dashboard.html';
    } else {
        alert("Usuário ou senha incorretos.");
    }
}
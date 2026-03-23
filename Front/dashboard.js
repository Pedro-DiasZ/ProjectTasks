const input = document.getElementById("taskInput");
const btn = document.getElementById("addTaskBtn");
const list = document.getElementById("taskList");

function togglemode() {
    const html = document.documentElement;
    html.classList.toggle("dark");

    if (html.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
});

function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("loginStorage");
    window.location.href = "/";
}

const API_URL = "https://projecttasks.onrender.com";

function isJwt(token) {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

function getToken() {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const cleaned = raw.replace(/^Bearer\s+/i, "").replace(/^"|"$/g, "").trim();
    if (!isJwt(cleaned)) return null;
    return cleaned;
}

function getAuthHeaders() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
    };
}

function checkAuth(response) {
    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("loginStorage");
        window.location.href = "/";
        throw new Error("Token expirado. Redirecionando para login...");
    }
    return response;
}

async function loadTasks() {
    try {
        const token = getToken();
        if (!token) {
            console.warn("Sem token. Redirecionando para login...");
            window.location.href = "/";
            return;
        }

        const headers = getAuthHeaders();
        console.log("Headers sendo enviados:", headers);
        console.log("Token completo:", token);

        const response = await fetch(`${API_URL}/tasks`, {
            headers: headers
        });

        console.log("Status da resposta GET /tasks:", response.status);

        if (response.status === 401 || response.status === 422) {
            let errorMsg = "Token inválido ou expirado.";
            try {
                const errData = await response.json();
                if (errData && errData.error) errorMsg = errData.error;
            } catch (e) {
                // ignore JSON parse errors
            }
            console.error(`Auth error (${response.status}):`, errorMsg);
            alert(`Erro de autenticação (${response.status}): ${errorMsg}\nVocê será redirecionado em 5s.`);
            localStorage.removeItem("token");
            localStorage.removeItem("loginStorage");
            setTimeout(() => {
                window.location.href = "/";
            }, 5000);
            return;
        }

        if (!response.ok) throw new Error(`Erro ao carregar tarefas: ${response.status}`);

        const tasks = await response.json();
        console.log("Tarefas carregadas:", tasks);

        if (!Array.isArray(tasks)) {
            console.error("Resposta não é um array:", tasks);
            throw new Error("Formato de resposta inválido");
        }

        list.innerHTML = "";
        tasks.forEach((task) => renderTask(task));
    } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
    }
}

function renderTask(task) {
    const li = document.createElement("li");
    li.classList.add("taskList");
    if (task.completed) li.classList.add("done");

    li.innerHTML = `
        <div class="task_left">
            <input type="checkbox" ${task.completed ? "checked" : ""}>
            <span>${task.title}</span>
        </div>
        <div class="task_actions">
            <i class="edit"><img src="/assets/edicao.png" alt="Editar"></i>
            <i class="delete"><img src="/assets/lixeira.png" alt="Excluir"></i>
        </div>
    `;

    li.querySelector("input").addEventListener("change", async (e) => {
        try {
            const response = await fetch(`${API_URL}/tasks/${task.id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ completed: e.target.checked })
            });

            checkAuth(response);
            li.classList.toggle("done", e.target.checked);
        } catch (error) {
            console.error("Erro ao atualizar tarefa:", error);
        }
    });

    li.querySelector(".delete").addEventListener("click", async () => {
        try {
            const response = await fetch(`${API_URL}/tasks/${task.id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            checkAuth(response);
            li.remove();
        } catch (error) {
            console.error("Erro ao deletar tarefa:", error);
        }
    });

    li.querySelector(".edit").addEventListener("click", async () => {
        const newTitle = prompt("Editar tarefa:", task.title);
        if (!newTitle || newTitle.trim() === "") return;

        try {
            const response = await fetch(`${API_URL}/tasks/${task.id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ title: newTitle })
            });

            checkAuth(response);
            li.querySelector("span").textContent = newTitle;
        } catch (error) {
            console.error("Erro ao editar tarefa:", error);
        }
    });

    list.appendChild(li);
}

btn.addEventListener("click", createTask);

async function createTask() {
    if (input.value.trim() === "") return;

    try {
        const token = getToken();
        if (!token) {
            alert("Sessão expirada. Faça login novamente.");
            logoutUser();
            return;
        }

        const taskTitle = input.value;
        const response = await fetch(`${API_URL}/tasks`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: taskTitle
            })
        });

        if (response.status === 401 || response.status === 422) {
            let errorMsg = "Token inválido ou expirado.";
            try {
                const errData = await response.json();
                if (errData && errData.error) errorMsg = errData.error;
            } catch (e) {
                // ignore JSON parse errors
            }
            console.error(`Auth error (${response.status}):`, errorMsg);
            alert(`Erro de autenticação (${response.status}): ${errorMsg}\nVocê será redirecionado em 5s.`);
            localStorage.removeItem("token");
            localStorage.removeItem("loginStorage");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 5000);
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Erro ao criar tarefa: ${response.status}`);
        }

        const task = await response.json();
        console.log("Tarefa criada com sucesso:", task);

        if (!task || !task.title) {
            console.error("Resposta inválida do servidor:", task);
            alert("Erro: servidor retornou tarefa sem título");
            return;
        }

        renderTask(task);
        input.value = "";
    } catch (error) {
        console.error("Erro ao criar tarefa:", error);
        alert("Erro ao criar tarefa: " + error.message);
    }
}

function usernameDisplay() {
    const user = localStorage.getItem("loginStorage");
    if (user) {
        const username = document.getElementById("username");
        if (username) {
            username.textContent = `Ola, ${user}`;
        }
    }
}

// ✅ FIX: variável com nome correto
let accessToken = null;

export async function fetchWithRefresh(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
            ...options.headers,
        },
    });

    if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (!refreshed) {
            redirectToLogin();
            return res;
        }
        return fetch(url, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
                ...options.headers,
            },
        });
    }

    return res;
}

async function tryRefresh() {
    const res = await fetch("/refresh", {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.access_token; 
    return true;
}

export function setAccessToken(token) { accessToken = token; }
function redirectToLogin() { window.location.href = "/"; }
window.togglemode = togglemode;
window.logoutUser = logoutUser;

document.addEventListener("DOMContentLoaded", () => {
    usernameDisplay();
    loadTasks();
});

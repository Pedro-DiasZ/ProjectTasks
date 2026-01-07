const input = document.getElementById('taskInput');
const btn = document.getElementById('addTaskBtn');
const list = document.getElementById('taskList');

function togglemode() {
    const html = document.documentElement;
    html.classList.toggle("dark");

    if (html.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem("theme");
    
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
});


function logoutUser() {
    window.location.href = 'index.html'; 
}

const API_URL = 'https://projecttasks.onrender.com';

async function loadTasks() {
    try {
        const user = localStorage.getItem('loginStorage');
        const response = await fetch(`${API_URL}/tasks?user=${user}`);
        const tasks = await response.json();

        list.innerHTML = '';
        tasks.forEach(task => renderTask(task));
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
    }
}

function renderTask(task) {
    const li = document.createElement('li');
    li.classList.add('taskList');
    if (task.completed) li.classList.add('done');

    li.innerHTML = `
        <div class="task_left">
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span>${task.title}</span>
        </div>
        <div class="task_actions">
            <i class="edit">Edit</i>
            <i class="delete">Remove</i>
        </div>
    `;

    li.querySelector('input').addEventListener('change', async (e) => {
        try {
            await fetch(`${API_URL}/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: e.target.checked })
            });

            li.classList.toggle('done', e.target.checked);
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
        }
    });

    li.querySelector('.delete').addEventListener('click', async () => {
        try {
            await fetch(`${API_URL}/tasks/${task.id}`, {
                method: 'DELETE'
            });
            li.remove();
        } catch (error) {
            console.error('Erro ao deletar tarefa:', error);
        }
    });

    li.querySelector('.edit').addEventListener('click', async () => {
        const newTitle = prompt('Editar tarefa:', task.title);
        if (!newTitle || newTitle.trim() === '') return;

        try {
            await fetch(`${API_URL}/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });

            li.querySelector('span').textContent = newTitle;
        } catch (error) {
            console.error('Erro ao editar tarefa:', error);
        }
    });

    list.appendChild(li);
}

btn.addEventListener('click', createTask);

async function createTask() {
    if (input.value.trim() === '') return;
    const user = localStorage.getItem('loginStorage'); //

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: input.value,
                user: user
            })
        });

        const task = await response.json();
        renderTask(task);
        input.value = '';
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
    }
}

function usernameDisplay() {
    const user = localStorage.getItem('loginStorage');
    if (user) {
        const username = document.getElementById('username');
        if (username) {
            username.textContent = `Olá, ${user}`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    usernameDisplay();
    loadTasks();
});

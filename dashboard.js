const input = document.getElementById('taskInput');
const btn = document.getElementById('addTaskBtn');
const list = document.getElementById('taskList');
const logout = document.getElementById('logout');


btn.addEventListener('click', addTask);

function addTask() {
    if (input.value.trim() === '') return;

    const li = document.createElement('li');
    li.classList.add('taskList');

    li.innerHTML = `
        <div class="task_left">
            <input type="checkbox">
            <span>${input.value}</span>
        </div>
        <div class="task_actions">
            <i class="edit">Edit</i>
            <i class="delete">Remove</i>
        </div>
    `;

    // marcar como concluída
    li.querySelector('input').addEventListener('change', e => {
        li.classList.toggle('done', e.target.checked);
    });

    // deletar
    li.querySelector('.delete').addEventListener('click', () => {
        li.remove();
    });

    // editar
    li.querySelector('.edit').addEventListener('click', () => {
        const newTask = prompt('Edit task:', input.value);
        if (newTask !== null && newTask.trim() !== '') {
            li.querySelector('span').textContent = newTask;
        }
    });

    list.appendChild(li);
    input.value = '';
}

function logoutUser() {
    window.location.href = 'login.html';
}

function usernameDisplay() {
    const user = localStorage.getItem('loginStorage');

    if (user) {
        const username = document.getElementById('username');
        username.textContent = `Olá, ${user}`;
    }
}

document.addEventListener('DOMContentLoaded', usernameDisplay);






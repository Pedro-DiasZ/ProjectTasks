# MyTasks

Gerenciador de tarefas com autenticação JWT, CRUD completo e interface com tema claro/escuro.

🔗 **[Ver projeto ao vivo](https://project-tasks-ten.vercel.app)**

---

## Sobre

O MyTasks permite que cada usuário gerencie suas próprias tarefas de forma simples e segura. O foco foi construir uma aplicação fullstack funcional do zero — do banco de dados ao frontend — com autenticação real e deploy em produção.

## Stack

- **Frontend:** HTML, CSS e JavaScript puro
- **Backend:** Python, Flask, Flask-JWT-Extended, Flask-SQLAlchemy
- **Banco de dados:** PostgreSQL (Supabase)
- **Deploy:** Vercel (frontend) + Render (backend)

## Funcionalidades

- Cadastro e login de usuários
- Autenticação via JWT com expiração de 24h
- CRUD completo de tarefas por usuário
- Cada usuário enxerga apenas as próprias tarefas
- Tema claro/escuro

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/register` | Cadastra usuário |
| POST | `/login` | Autentica e retorna token |
| GET | `/tasks` | Lista tarefas do usuário |
| POST | `/tasks` | Cria tarefa |
| PUT | `/tasks/<id>` | Edita tarefa |
| DELETE | `/tasks/<id>` | Remove tarefa |

> Rotas de tarefas exigem `Authorization: Bearer <token>`

## Como rodar localmente
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m backend.app
```

Configure um `.env` na raiz com `DATABASE_URL` e `JWT_SECRET_KEY`. O front é estático — abra `Front/index.html` no navegador.

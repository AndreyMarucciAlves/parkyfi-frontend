# Parkyfi Frontend

Aplicação web do **Parkyfi**, um sistema de gerenciamento de estacionamento.

## Sobre o projeto

Este projeto é uma atividade acadêmica da disciplina **Arquitetura de Software: Estilos Arquiteturais**.

### Arquitetura

A arquitetura escolhida pelo grupo foi **Cliente-Servidor**:

- **Cliente (este repositório):** aplicação SPA em React + TypeScript, responsável pela interface com o usuário. Consome a API via HTTP/JSON.
- **Servidor:** API REST em Spring Boot, responsável pelas regras de negócio e pela persistência dos dados em PostgreSQL — [parkyfi-backend](https://github.com/AndreyMarucciAlves/parkyfi-backend).

```
┌──────────────┐    HTTP/JSON    ┌──────────────┐      JDBC      ┌──────────────┐
│   Frontend   │ ──────────────► │   Backend    │ ─────────────► │  PostgreSQL  │
│  (Cliente)   │ ◄────────────── │  (Servidor)  │ ◄───────────── │              │
└──────────────┘                 └──────────────┘                └──────────────┘
```

## Grupo

- Andrey Marucci
- João Szczypior
- Henrique Cavalari
- Josephy Rocha
- Enzo Schmidt
- Eduardo Apolônio

## Funcionalidades

| Rota | Tela |
|---|---|
| `/login` | Login |
| `/` | Dashboard |
| `/cadastro-cliente` | Cadastro de cliente |
| `/cadastro-cliente/:id` | Edição de cliente |
| `/cadastro-veiculo` | Cadastro de veículo |
| `/cadastro-veiculo/:id` | Edição de veículo |

## Tecnologias

| Tecnologia | Versão |
|---|---|
| React | 19.3 |
| TypeScript | 7.0 |
| Vite | 8.3 |
| React Router | 7.18 |
| Axios | 1.21 |
| Oxlint | 1.89 |

## Estrutura

```
src/
├── contexts/   # Contexto de autenticação
├── pages/      # Telas da aplicação
├── services/   # Cliente HTTP (Axios) e chamadas à API
└── types/      # Tipos TypeScript
```

## Como executar

### Pré-requisitos

- Node.js e npm
- [Backend](https://github.com/AndreyMarucciAlves/parkyfi-backend) rodando localmente

### 1. Configurar variáveis de ambiente

Copie o template e ajuste os valores, se necessário:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API do backend (ex.: `http://localhost:8081/api`) |

### 2. Instalar as dependências

```bash
npm install
```

### 3. Rodar a aplicação

```bash
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Executa o Oxlint |

## Links

- Backend: https://github.com/AndreyMarucciAlves/parkyfi-backend

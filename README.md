# Parkyfi Frontend

Interface web do **Parkyfi**, um sistema de gerenciamento de estacionamento.

## Sobre o projeto

Este projeto é um trabalho acadêmico da disciplina **Arquitetura de Software: Estilos Arquiteturais**.

### Arquitetura

A arquitetura escolhida pelo grupo foi **Cliente-Servidor**:

- **Servidor:** API REST em Spring Boot, responsável pelas regras de negócio e pela persistência dos dados em PostgreSQL — [parkyfi-backend](https://github.com/AndreyMarucciAlves/parkyfi-backend).
- **Cliente (este repositório):** aplicação frontend em React que consome a API via HTTP.

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
- Enzo Schmidt
- Josephy Rocha
- Eduardo Apolônio

## Frontend

### O que é

O frontend é a interface do sistema **Parkfy**, usada pelos operadores do estacionamento para:

- visualizar os clientes cadastrados;
- cadastrar e editar clientes;
- visualizar os veículos, quantos estão no estacionamento e quantos já saíram;
- cadastrar e editar veículos, vinculando-os a um cliente.

### Telas e rotas

| Rota | Tela | Descrição |
|---|---|---|
| `/login` | Login | Tela de acesso apenas visual (demonstração). Não há autenticação no sistema. |
| `/` | Painel | Lista de clientes e de veículos, com contadores e atalhos para cadastro e edição. |
| `/cadastro-cliente` | Novo cliente | Formulário de cadastro de cliente. |
| `/cadastro-cliente/:id` | Editar cliente | Formulário de edição de um cliente existente. |
| `/cadastro-veiculo` | Novo veículo | Formulário de cadastro de veículo. |
| `/cadastro-veiculo/:id` | Editar veículo | Formulário de edição de um veículo existente. |

### Tecnologias

| Tecnologia | Versão (`package.json`) |
|---|---|
| React | ^19.3.1 |
| React DOM | ^19.3.1 |
| React Router DOM | ^7.18.5 |
| Axios | ^1.21.0 |
| TypeScript | ^7.0.2 |
| Vite | ^8.3.5 |
| @vitejs/plugin-react | ^6.1.2 |
| Oxlint (lint) | ^1.89.0 |

O projeto foi criado com o template React + Vite em TypeScript. O código é organizado da seguinte forma:

```
parkyfi-frontend/
├── index.html                  # Ponto de entrada HTML
├── vite.config.ts              # Configuração do Vite (plugin React)
├── tsconfig.json               # Configuração do TypeScript
├── .oxlintrc.json              # Regras do Oxlint
├── .env.example                # Modelo de variáveis de ambiente
└── src/
    ├── main.tsx                # Renderiza a aplicação no DOM (StrictMode)
    ├── App.tsx                 # Definição das rotas (React Router)
    ├── pages/                  # Telas: Login, Dashboard, cadastros de cliente e veículo
    ├── services/
    │   ├── api.ts              # Instância do Axios com a URL base da API
    │   └── estacionamento.ts   # Chamadas aos endpoints de clientes e veículos
    ├── types/
    │   └── estacionamento.ts   # Interfaces Cliente e Veiculo (e seus DTOs de requisição)
    └── assets/                 # Imagens e ícones
```

### Integração com a API

A URL base da API é lida da variável de ambiente `VITE_API_URL` (com fallback para `http://localhost:8081/v1/api`). Os serviços em `src/services/estacionamento.ts` utilizam os seguintes endpoints do backend:

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/clientes` | Listar clientes |
| GET | `/clientes/{id}` | Buscar cliente por ID |
| POST | `/clientes` | Criar cliente |
| PUT | `/clientes/{id}` | Atualizar cliente |
| DELETE | `/clientes/{id}` | Excluir cliente |
| GET | `/veiculos` | Listar veículos |
| GET | `/veiculos/cliente/{clienteId}` | Listar veículos de um cliente |
| GET | `/veiculos/no-estacionamento` | Listar veículos no estacionamento |
| GET | `/veiculos/{id}` | Buscar veículo por ID |
| POST | `/veiculos` | Criar veículo |
| PUT | `/veiculos/{id}` | Atualizar veículo |
| PUT | `/veiculos/{id}/saida` | Registrar saída do veículo |
| DELETE | `/veiculos/{id}` | Excluir veículo |

## Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada) com npm
- Backend Parkyfi em execução (veja o [README do backend](https://github.com/AndreyMarucciAlves/parkyfi-backend))

### 1. Instalar as dependências

Na raiz do projeto:

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API do backend. Para o backend rodando localmente, use `http://localhost:8081/v1/api`. |

> **Atenção:** o `.env.example` traz `http://localhost:8080/v1/api`, mas o backend sobe por padrão em `http://localhost:8081/v1/api`. Ajuste o valor no `.env` para a porta em que o backend está rodando.

O arquivo `.env` não é versionado (está no `.gitignore`).

### 3. Rodar em modo de desenvolvimento

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

### Outros scripts

| Comando | Função |
|---|---|
| `npm run build` | Gera a versão de produção na pasta `dist/` |
| `npm run preview` | Sobe um servidor local para visualizar o build de produção |
| `npm run lint` | Executa o Oxlint sobre o código |

## Limitações conhecidas

- A tela de login é apenas demonstrativa: qualquer e-mail válido leva ao painel.
- No painel, as ações de **excluir** cliente/veículo e **registrar saída** ainda não estão ligadas à API (aparecem como pendentes no código).
- Se o navegador acusar erro de CORS ao chamar a API, verifique a configuração de CORS do backend para a origem `http://localhost:5173`.

## Links

- Backend: https://github.com/AndreyMarucciAlves/parkyfi-backend
- Frontend: https://github.com/AndreyMarucciAlves/parkyfi-frontend

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

O frontend é a interface operacional do sistema **Parkyfi**, com acesso direto ao painel (sem tela de login), usada pelos operadores do estacionamento para:

- registrar a entrada de veículos (gerando tickets) e acompanhar veículos no pátio em tempo real;
- consultar a prévia de saída com cálculo automático de permanência e valor total, e confirmar a cobrança/saída;
- cadastrar, listar, editar e excluir veículos;
- cadastrar, listar, editar e excluir tipos de veículo e suas respectivas tarifas por hora;
- paginar e ordenar listagens diretamente pela API.

### Telas e rotas

| Rota | Tela | Descrição |
|---|---|---|
| `/` | Painel | Visão operacional com indicadores, controle de tickets (entrada e saída), veículos e tipos/tarifas. |
| `/cadastro-veiculo` | Novo veículo | Formulário de cadastro de veículo vinculado a um tipo de veículo. |
| `/cadastro-veiculo/:id` | Editar veículo | Formulário de edição de um veículo existente. |
| `/cadastro-tipo-veiculo` | Novo tipo de veículo | Formulário de cadastro de categoria e tarifa por hora. |
| `/cadastro-tipo-veiculo/:id` | Editar tipo de veículo | Formulário de edição de um tipo de veículo existente. |

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
    ├── pages/                  # Telas: Dashboard, CadastroVeiculo e CadastroTipoVeiculo
    ├── services/
    │   ├── api.ts              # Instância do Axios e tratamento de erros da API
    │   └── estacionamento.ts   # Chamadas aos endpoints de tickets, veículos e tipos de veículo
    ├── types/
    │   └── estacionamento.ts   # Interfaces e DTOs compatíveis com o backend
    └── assets/                 # Imagens e ícones
```

### Integração com a API

A URL base da API é lida da variável de ambiente `VITE_API_URL` (com fallback para `http://localhost:8081/v1/api`). Os serviços em `src/services/estacionamento.ts` utilizam os seguintes endpoints do backend:

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/tickets` | Listar tickets paginados e ordenados |
| POST | `/tickets/save` | Registrar entrada de veículo (cria ticket e veículo se necessário) |
| GET | `/tickets/get-dados-saida/{ticketId}` | Consultar prévia de tempo e valor total para saída |
| POST | `/tickets/registrar-saida` | Registrar saída e finalizar ticket |
| GET | `/veiculo` | Listar veículos paginados e ordenados |
| GET | `/veiculo/edicao/{idVeiculo}` | Buscar veículo por ID |
| POST | `/veiculo/save` | Cadastrar ou atualizar veículo |
| DELETE | `/veiculo/{idVeiculo}` | Excluir veículo |
| GET | `/tipo-veiculo` | Listar tipos de veículo paginados e ordenados |
| GET | `/tipo-veiculo/edicao/{idTipoVeiculo}` | Buscar tipo de veículo por ID |
| POST | `/tipo-veiculo/save` | Cadastrar ou atualizar tipo de veículo |
| DELETE | `/tipo-veiculo/{idTipoVeiculo}` | Excluir tipo de veículo |

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
| `VITE_API_URL` | URL base da API do backend (`http://localhost:8081/v1/api` por padrão). |

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

## Links

- Backend: https://github.com/AndreyMarucciAlves/parkyfi-backend
- Frontend: https://github.com/AndreyMarucciAlves/parkyfi-frontend

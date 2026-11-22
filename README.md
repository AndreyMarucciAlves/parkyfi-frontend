# Parkyfi Frontend

Interface web do **Parkyfi**, um sistema para controle operacional de estacionamentos.

## Sobre o projeto

Este projeto faz parte de um trabalho acadêmico da disciplina **Arquitetura de Software: Estilos Arquiteturais** e segue o modelo cliente-servidor:

- **Backend:** API REST desenvolvida em Spring Boot com banco de dados PostgreSQL, disponível no repositório [parkyfi-backend](https://github.com/AndreyMarucciAlves/parkyfi-backend).
- **Frontend (este repositório):** aplicação web em React que consome a API via HTTP para gerenciar entradas, saídas, veículos e tarifas.

## Grupo

- Andrey Marucci
- João Szczypior
- Henrique Cavalari
- Enzo Schmidt
- Josephy Rocha
- Eduardo Apolônio

## Funcionalidades e rotas

O sistema abre diretamente no painel operacional (sem tela de login) e oferece suporte completo aos recursos da API:

| Rota | Tela | O que faz |
|---|---|---|
| `/` | Painel principal | Exibe indicadores do pátio, controla tickets (entrada, prévia de cobrança e saída) e lista veículos e categorias com paginação e ordenação. |
| `/cadastro-veiculo` | Novo veículo | Cadastra um veículo informando placa, modelo, cor e categoria tarifária. |
| `/cadastro-veiculo/:id` | Editar veículo | Atualiza os dados de um veículo já cadastrado. |
| `/cadastro-tipo-veiculo` | Novo tipo de veículo | Cadastra uma nova categoria e define o valor cobrado por hora. |
| `/cadastro-tipo-veiculo/:id` | Editar tipo de veículo | Atualiza a descrição ou o valor por hora de uma categoria existente. |

## Tecnologias utilizadas

- React 19 e React Router DOM 7
- TypeScript 7
- Vite 8
- Axios
- Oxlint

## Estrutura do projeto

```text
parkyfi-frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── .oxlintrc.json
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── Dashboard.css
    │   ├── CadastroVeiculo.tsx
    │   ├── CadastroVeiculo.css
    │   ├── CadastroTipoVeiculo.tsx
    │   └── CadastroTipoVeiculo.css
    ├── services/
    │   ├── api.ts
    │   └── estacionamento.ts
    └── types/
        └── estacionamento.ts
```

## Endpoints consumidos da API

Por padrão, o frontend se conecta em `http://localhost:8081/v1/api` (configurável via `VITE_API_URL`):

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/tickets` | Lista tickets com paginação e ordenação |
| POST | `/tickets/save` | Registra entrada do veículo e gera um ticket |
| GET | `/tickets/get-dados-saida/{ticketId}` | Calcula prévia do tempo de permanência e valor total |
| POST | `/tickets/registrar-saida` | Finaliza o ticket e registra a saída |
| GET | `/veiculo` | Lista veículos com paginação e ordenação |
| GET | `/veiculo/edicao/{idVeiculo}` | Busca um veículo para edição |
| POST | `/veiculo/save` | Cadastra ou atualiza um veículo |
| DELETE | `/veiculo/{idVeiculo}` | Exclui um veículo |
| GET | `/tipo-veiculo` | Lista tipos de veículo com paginação e ordenação |
| GET | `/tipo-veiculo/edicao/{idTipoVeiculo}` | Busca um tipo de veículo para edição |
| POST | `/tipo-veiculo/save` | Cadastra ou atualiza um tipo de veículo |
| DELETE | `/tipo-veiculo/{idTipoVeiculo}` | Exclui um tipo de veículo |

## Como rodar o projeto

### 1. Suba o backend primeiro

Para que o frontend consiga carregar e salvar os dados, o servidor do repositório [parkyfi-backend](https://github.com/AndreyMarucciAlves/parkyfi-backend) precisa estar rodando na porta `8081` com o banco PostgreSQL ativo. Siga as instruções de execução do próprio repositório do backend antes de iniciar a interface.

### 2. Instale as dependências do frontend

Na pasta raiz deste projeto (`parkyfi-frontend`), instale os pacotes:

```bash
npm install
```

### 3. Configure o arquivo de ambiente (opcional)

Caso o backend esteja rodando em outro endereço ou porta, crie o `.env` a partir do modelo:

```bash
cp .env.example .env
```

No arquivo `.env`, defina a URL da API:

```env
VITE_API_URL=http://localhost:8081/v1/api
```

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Depois disso, basta abrir `http://localhost:5173` no navegador.

### Comandos úteis

- `npm run build`: gera os arquivos finais de produção na pasta `dist/`
- `npm run preview`: sobe uma prévia local do build de produção
- `npm run lint`: verifica o código com o Oxlint

## Repositórios

- Backend: https://github.com/AndreyMarucciAlves/parkyfi-backend
- Frontend: https://github.com/AndreyMarucciAlves/parkyfi-frontend

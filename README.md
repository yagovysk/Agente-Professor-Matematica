# Professor de Matematica (TypeScript)

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)
![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-0A6C8F)

Aplicacao web de chat para estudo de matematica, com foco em explicacoes claras em portugues (BR).
O aluno pode perguntar sobre Bhaskara, equacoes, produtos notaveis, inequacoes e outros temas, e receber respostas passo a passo.

## Portfolio Snapshot

- Projeto: Professor virtual de matematica com IA
- Foco: Didatica em portugues (BR)
- Formato: Web app com API propria
- Destaque: Explicacoes passo a passo para Bhaskara e temas correlatos

## Demo local

- URL local: http://localhost:3000
- Endpoint de health check: http://localhost:3000/health

## Objetivo do projeto

Este projeto foi criado para funcionar como um professor virtual de matematica:

- linguagem simples e didatica
- explicacao orientada por etapas
- interface direta para perguntar e aprender rapido

## O que o sistema faz

- Recebe perguntas do aluno por uma interface web.
- Envia a pergunta para um backend em TypeScript.
- O backend consulta um modelo de IA com um prompt especializado em ensino de matematica.
- Retorna a resposta ao aluno no mesmo chat.

## Arquitetura resumida

- Frontend estatico: HTML, CSS e JavaScript em public.
- API HTTP: Express com rota de chat em /api/chat.
- Servico de IA: camada dedicada para conversar com Ollama local.
- Validacao: Zod para garantir payload valido e reduzir erros.
- Testes: Vitest + Supertest para garantir comportamento da API.

## Tecnologias usadas e por que foram escolhidas

### TypeScript

Por que usar:

- Evita classes comuns de erro com tipagem estatica.
- Facilita manutencao e evolucao do codigo.
- Melhora a confianca em refatoracoes.

### Node.js

Por que usar:

- Ambiente leve para API e integracao com IA.
- Ecossistema maduro e rapido para desenvolvimento.

### Express

Por que usar:

- Simples para criar API REST.
- Curva de aprendizado baixa.
- Boa combinacao com middlewares (JSON, CORS, static).

### Ollama (modelo local)

Por que usar:

- Gratuito para uso local.
- Baixa latencia no desenvolvimento.
- Permite trocar de modelo sem alterar o frontend.

### Zod

Por que usar:

- Valida entrada de forma declarativa.
- Retorna erros previsiveis para o frontend.
- Aumenta seguranca da API com limites de tamanho e formato.

### Vitest + Supertest

Por que usar:

- Testes rapidos no ambiente Node.
- Supertest facilita validar rotas HTTP sem subir servidor real.
- Garante confiabilidade do endpoint principal.

## Estrutura de pastas

```text
site-test/
  public/
    app.js
    index.html
    styles.css
  src/
    services/
      aiTeacher.ts
    app.ts
    app.test.ts
    server.ts
    types.ts
  .env.example
  package.json
  tsconfig.json
  vitest.config.ts
```

## Requisitos

- Node.js 18+
- Ollama instalado localmente
- Modelo baixado no Ollama (ex.: qwen2.5:3b)

## Configuracao do ambiente

1. Instale dependencias:

```bash
npm install
```

2. Crie o arquivo .env com base no exemplo:

```bash
copy .env.example .env
```

3. Preencha as variaveis:

- OLLAMA_BASE_URL=http://127.0.0.1:11434
- OLLAMA_MODEL=qwen2.5:3b
- PORT=3000

4. Inicie o Ollama e baixe um modelo gratuito:

```bash
ollama pull qwen2.5:3b
ollama run qwen2.5:3b
```

## Como rodar

### Desenvolvimento

```bash
npm run dev
```

Abra no navegador:

- http://localhost:3000

### Producao (build)

```bash
npm run build
npm start
```

## Testes

```bash
npm test
```

## Contrato da API

### POST /api/chat

Request:

```json
{
  "question": "Me explique Bhaskara com exemplo",
  "history": [
    { "role": "user", "content": "Pergunta anterior" },
    { "role": "assistant", "content": "Resposta anterior" }
  ]
}
```

Response de sucesso:

```json
{
  "answer": "..."
}
```

## Decisoes de produto

- Interface enxuta para reduzir friccao de uso.
- Historico curto de conversa para equilibrar contexto, latencia e custo.
- Foco em portugues (BR) para maior acessibilidade ao publico alvo.

## Limitacoes atuais

- Sem autenticacao de usuarios.
- Sem persistencia de historico em banco de dados.
- Sem modo offline (depende da API de IA).

## Melhorias futuras sugeridas

- Modo exercicios com correcao automatica.
- Perfis de nivel (fundamental, medio, vestibular).
- Persistencia de conversas por aluno.
- Dashboard de desempenho e progresso.

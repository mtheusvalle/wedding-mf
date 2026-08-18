# Site de Casamento Completo 💖

Este é um site de casamento moderno, elegante e responsivo, construído com **Next.js (App Router)**, **TypeScript**, **CSS Vanilla** e **Prisma ORM (com suporte a PostgreSQL)**. 

O projeto inclui confirmação de presença (RSVP) personalizada, lista de presentes integrada a um fluxo de **Pix Manual** super seguro (com QR Code de imagem e Chave Pix configuráveis) com suporte a **cotas parciais/divisão de presentes**, e um painel de controle administrativo completo para os noivos gerenciarem os convidados, finanças, mídias e o conteúdo do site.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router com Turbopack)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: CSS Vanilla (CSS Modules e Global Theme Variables)
- **Banco de Dados**: [Prisma ORM](https://www.prisma.io/) com PostgreSQL (compatível com Neon, Supabase e Vercel Postgres)
- **Autenticação**: Sessão via Cookies seguros (JWT assinado com a biblioteca [jose](https://github.com/panva/jose))
- **Processamento de Imagem**: [Sharp](https://github.com/lovell/sharp) para compressão automática de uploads locais em WebP a 80% de qualidade e rotação automática de orientação EXIF.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 20 ou superior
- npm (gerenciador de pacotes)

### Passo a Passo

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz do projeto com base nas seguintes variáveis:
   ```env
   # Senha de acesso ao Painel Administrativo (/admin)
   ADMIN_PASSWORD="sua_senha_secreta_aqui"

   # Chave para criptografia dos tokens JWT de sessão (ex: uma hash aleatória longa)
   JWT_SECRET="sua_hash_jwt_secreta_aqui"

   # URL de Conexão com o Banco de Dados
   # O Prisma iniciará automaticamente uma URL local ao rodar `npx prisma dev`
   DATABASE_URL="prisma+postgres://localhost:51213/?api_key=eyJ..."
   ```

3. **Iniciar o Banco de Dados Local (Prisma Postgres)**:
   O Prisma possui um banco de dados Postgres leve e nativo rodando localmente na sua máquina (via PGlite). Para iniciá-lo, execute:
   ```bash
   npx prisma dev
   ```
   *Deixe esse terminal rodando em segundo plano. Ele gerenciará a instância local de testes.*

4. **Rodar as Migrações do Banco**:
   Em outro terminal, aplique o esquema no banco de dados local:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Popular o Banco com Dados Iniciais (Seed)**:
   Insira as informações básicas (noivos de teste, presentes, chave Pix padrão e convidados de teste) no banco:
   ```bash
   npx prisma db seed
   ```

6. **Executar o Servidor de Desenvolvimento**:
   Inicie a aplicação Next.js:
   ```bash
   npm run dev
   ```
   O site estará disponível em [http://localhost:3000](http://localhost:3000).

---

## 🔒 Fluxo de Presentes & Conciliação Manual de Pix (Segurança Máxima)

Para garantir segurança total contra fraudes ou instabilidades em gateways de terceiros, o sistema utiliza o fluxo de Pix Manual:

1. **Seleção de Cotas**: O convidado clica em "Presentear" e escolhe pagar o valor integral ou inserir um valor customizado de cota (cota parcial).
2. **Identificação Simples**: Ele informa apenas seu **Nome Completo** e deixa um **Recadinho** (opcional) para o casal. Não há necessidade de digitar e-mail ou WhatsApp.
3. **Instruções Pix**: Ao confirmar, ele é redirecionado para a página `/obrigado?id=...`, contendo a imagem do QR Code Pix e a Chave Pix dos noivos (com botão de copiar rápido), além do valor exato de sua contribuição.
4. **Histórico Pendente**: Uma nova transação é criada no banco de dados com status `Pendente`.
5. **Conciliação Manual**: Os noivos acessam o Painel Admin (`/admin`), verificam o extrato real em seu banco de preferência e clicam em **`✓ Confirmar`** no histórico de transações correspondente. O site muda o status para `Pago` e soma o valor à arrecadação total instantaneamente.

---

## 🔒 Acessando o Painel Admin

Acesse [http://localhost:3000/admin](http://localhost:3000/admin) para entrar no painel de controle dos noivos.

- **Senha Padrão do Seed**: `admin123` (se alterou no `.env`, utilize a nova senha).
- **Funcionalidades do Painel**:
  - **Dashboard**: Métricas atualizadas sobre quantidade de convidados confirmados/não confirmados, presentes comprados e valores arrecadados em tempo real.
  - **Convidados (RSVP)**: Adicione novos nomes, gerencie a quantidade de acompanhantes permitidos e obtenha links individuais de WhatsApp (ex: `/confirmar-presenca/joao123`) para mandar diretamente.
  - **Presentes & Caixa**: Cadastre, edite ou exclua presentes na lista pública e monitore o histórico de pagamentos de presentes com ações rápidas de confirmação de Pix.
  - **Galeria de Fotos**: Gerenciamento de fotos dinâmicas no site com controle ativo/inativo.
  - **Galeria de Mídias**: Gerenciamento de uploads de arquivos locais com otimização/compressão de imagem automática para WebP via Sharp.
  - **Configurações**: Modifique dinamicamente os nomes dos noivos, data, locais, mapas (Google Maps), fotos de história e do topo, além da Chave Pix e imagem do QR Code bancário de vocês.

---

## ☁️ Hospedagem na Vercel

O projeto foi projetado para rodar nativamente em ambiente Serverless na Vercel.

### Passo 1: Criar um Banco de Dados PostgreSQL
Você precisará de um banco de dados PostgreSQL ativo. Recomendamos utilizar o **Vercel Postgres**, **Supabase** (gratuito) ou **Neon** (gratuito). 
Copie a URL de conexão direta fornecida (ex: `postgres://usuario:senha@host/banco`).

### Passo 2: Criar Projeto na Vercel
1. Importe seu repositório no painel da Vercel.
2. Adicione as variáveis de ambiente em **Settings > Environment Variables**:
   - `ADMIN_PASSWORD` (Senha do Admin)
   - `JWT_SECRET` (Senha JWT aleatória)
   - `DATABASE_URL` (Sua string de conexão PostgreSQL obtida no Passo 1)

### Passo 3: Build & Deploy
Para garantir que as migrações do banco sejam executadas automaticamente a cada deploy, configure o comando de build no painel da Vercel ou no seu `package.json`:
- **Build Command**: `npx prisma generate && npx prisma migrate deploy && next build`

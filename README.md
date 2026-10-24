# NutriApp

Plataforma de gestión nutricional clínica con asistente IA integrado. Conecta nutriólogos y pacientes en un flujo de trabajo moderno: planes alimentarios, seguimiento de adherencia, diario alimenticio y proyección de resultados.

**Demo interactivo (sin instalación):** https://claude.ai/artifact/PLU2HhcmaSU159skTx1Eup

---

## Funcionalidades principales

| Rol | Funcionalidades |
|---|---|
| **Nutriólogo** | Panel de pacientes, planes alimentarios, alertas de desviación, NutriAsistente IA |
| **Paciente** | Diario alimenticio, sustituciones IA, proyección de progreso, chat con el asistente |
| **Admin** | Gestión de nutriólogos, métricas de la clínica, facturación |

---

## Stack tecnológico

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express (arquitectura hexagonal)
- **Bases de datos:** PostgreSQL 17 + MongoDB
- **IA:** Groq (LLaMA 3.3 70b) · compatible con Claude (Anthropic)

---

## Requisitos previos

- Node.js 18+
- PostgreSQL 17
- MongoDB Community

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/DavidValencia13/NutriApp.git
cd NutriApp
```

### 2. Configurar variables de entorno

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # Mac / Linux
```

Abrir `backend/.env` y completar los campos vacíos:

```env
POSTGRES_PASSWORD=tu_contraseña_postgres
JWT_SECRET=cualquier-texto-secreto-largo
```

> Los demás valores ya vienen preconfigurados en `.env.example`.

### 3. Crear la base de datos

Conectarse a PostgreSQL (pgAdmin o psql) y ejecutar:

```sql
CREATE DATABASE nutriapp;
```

### 4. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Levantar la aplicación

Abrir **dos terminales**:

```bash
# Terminal 1 — Backend (puerto 3000)
cd backend
npm start

# Terminal 2 — Frontend (puerto 5173)
cd frontend
npm run dev
```

### 6. Abrir en el navegador

```
http://localhost:5173
```

---

## Variables de entorno — referencia

| Variable | Descripción | Requerida |
|---|---|---|
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | ✅ |
| `JWT_SECRET` | Clave para firmar tokens JWT | ✅ |
| `GROQ_API_KEY` | API key de Groq (IA) | ✅ |
| `IA_PROVIDER` | `groq` (default) o `anthropic` | — |
| `ANTHROPIC_API_KEY` | Solo si `IA_PROVIDER=anthropic` | Opcional |
| `USDA_FDC_API_KEY` | Base de datos nutricional USDA | Opcional |

---

## Estructura del proyecto

```
NutriApp/
├── backend/
│   ├── src/
│   │   ├── application/      # Casos de uso
│   │   ├── domain/           # Entidades y puertos (interfaces)
│   │   ├── infrastructure/   # Adaptadores (DB, IA, HTTP)
│   │   └── interfaces/       # Controladores y rutas
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── context/
└── docs/
```

---

## Créditos

Desarrollado por **Jimmy Jaramillo** · Clínica Central CBRS

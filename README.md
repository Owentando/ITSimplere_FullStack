
# CodeSync – Real-Time Collaborative Code & Whiteboard Editor

CodeSync is a full-stack web application that allows multiple users to collaborate on code documents and digital whiteboards in real time.

The platform provides a shared workspace where users can create documents, edit code, draw diagrams, manage document permissions, and review previous versions.

This project was developed as part of the IT-Simplera Solutions Full Stack Development Internship – Batch 02, Project 01.


## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Monaco Editor

### Backend
- Node.js
- Express.js
- Socket.IO

### Database
- PostgreSQL

### Authentication and Security
- JSON Web Tokens (JWT)
- bcryptjs for password hashing

### Version Control
- Git
- GitHub


## Features

### 1. User Authentication
- User registration and login.
- Password hashing using bcryptjs.
- JWT-based authentication.
- Protected API endpoints.

### 2. Document Management
- Create, view and delete documents.
- Support for code editor and whiteboard documents.
- Dashboard displaying owned and shared documents.

### 3. Code Editor
- Monaco Editor integration.
- Syntax highlighting.
- Multiple programming language options.
- Line numbers and automatic bracket matching.
- Automatic indentation.
- Real-time collaborative editing.
- Database persistence.

### 4. Collaborative Whiteboard
- Freehand drawing.
- Rectangle, circle and arrow shapes.
- Text insertion.
- Colour and stroke-width selection.
- Move, resize and delete objects.
- Zoom and pan controls.
- Undo and redo.
- Real-time collaboration and persistence.

### 5. Document Permissions
- Owner, Editor and Viewer roles.
- Share documents with other registered users.
- Role-based editing and access restrictions.

### 6. Version History
- View previous document versions.
- Restore previous versions.
- Restoring a version creates a new version entry.

### 7. Real-Time Communication
- Socket.IO integration.
- Real-time document updates.
- Automatic database persistence of collaborative changes.
- Socket authentication and permission checks.

### 8. Account and Workspace Settings
- Update your display name and change your password.
- Choose a default programming language, autosave delay and light or dark theme.
- Opt in to email notifications when a document is shared with you (SMTP configuration required).
- Delete your account after removing documents you own; shared access is revoked and version history is anonymized.


## Installation and Setup

### Prerequisites

Make sure the following are installed:
- Node.js
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Owentando/ITSimplere_FullStack.git
cd ITSimplere_FullStack
```

### 2. Set Up the Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder and configure the following environment variables:

```env
DB_USER=your_database_username
DB_HOST=localhost
DB_NAME=collaborative_editor
DB_PASSWORD=your_database_password
DB_PORT=5432
JWT_SECRET=your_secret_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=CodeSync <no-reply@your-domain.com>
APP_BASE_URL=http://localhost:5173
```

Replace the example values with your own local PostgreSQL credentials and a secure JWT secret.
Configure the SMTP values with your email provider to enable password reset links. Use port 465 with `SMTP_SECURE=true` for implicit TLS; other providers commonly use port 587 with `SMTP_SECURE=false`. The `APP_BASE_URL` value must be the frontend URL users visit. Reset links expire after 30 minutes and can only be used once.

Start the backend:

```bash
node server.js
```

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

### 4. Open the Application

Open the local URL displayed by Vite in your browser, usually:

http://localhost:5173

### Deploy to Render

Configure the backend as a Web Service with `server` as its root directory,
`npm install` as its build command, and `npm start` as its start command. The
server listens on Render's `PORT` environment variable.

Set these backend environment variables in Render:

```env
DATABASE_URL=<Render PostgreSQL internal URL>
JWT_SECRET=<a long, random secret>
APP_BASE_URL=https://itsimplere-fullstack-1.onrender.com
CLIENT_URL=https://itsimplere-fullstack-1.onrender.com
```

Configure the frontend as a Static Site with `client` as its root directory,
`npm install && npm run build` as its build command, and `dist` as its publish
directory. Set `VITE_API_BASE_URL=https://itsimplere-fullstack.onrender.com`.
The frontend defaults to these Render URLs in production, and the environment
variables can override them if the service URLs change.

Set SMTP environment variables on the backend to enable reset and sharing
emails. Keep database credentials, mail credentials, and JWT secrets in
Render's environment settings rather than in source code.


## Project Structure

```text
ITSimplere_FullStack/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── DocumentCard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ShareDocument.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Whiteboard.jsx
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   ├── socket.js
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── server/
│   ├── auth.js
│   ├── db.js
│   ├── middleware.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Current Limitations and Future Improvements

The current version provides the core collaborative editing functionality. The following improvements are planned for future development:

- Implement Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDT) for more robust simultaneous editing.
- Add live user presence indicators and collaborative cursors.
- Implement offline editing and synchronisation when users reconnect.
- Introduce shared pub/sub infrastructure for horizontal WebSocket scaling.
- Add code execution and live preview functionality.
- Expand automated testing and performance/load testing.
- Deploy the application to a production hosting environment.

## Project Status

The application currently supports authentication, document management, role-based permissions, collaborative code editing, whiteboard collaboration, database persistence and version history.

Further development is required to implement the remaining advanced collaboration and deployment features.


# CodeSync API Documentation

## 1. Introduction

This document describes the REST API used by the CodeSync Real-Time Collaborative Code and Whiteboard Editor.

The API allows the frontend application to communicate with the backend server, manage documents, authenticate users, control document permissions and access version history.

## 2. Technologies

- Node.js
- Express.js
- PostgreSQL
- JSON Web Tokens (JWT)
- Socket.IO

## 3. Base URL

During local development, the backend API runs at:

http://localhost:5000

API endpoints use the following prefix:

`/api`

## 4. Authentication

The application uses JSON Web Tokens (JWT) to authenticate users.

Users must log in to receive an authentication token. Protected API requests must include that token in the Authorization header.

Example:

`Authorization: Bearer YOUR_TOKEN`


## 5. Authentication Endpoints

### 5.1 Register a User

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required.

**Description:** Creates a new user account. The password is hashed using bcryptjs before being stored in the database.

**Request Body:**

```json
{
  "username": "exampleuser",
  "email": "user@example.com",
  "password": "your_password"
}
```

**Successful Response:**

Status: `201 Created`

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "exampleuser",
    "email": "user@example.com"
  }
}
```

**Possible Error Response:**

Status: `500 Internal Server Error`

```json
{
  "message": "Registration failed"
}
```

### 5.2 Login

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required.

**Description:** Authenticates a registered user by comparing the submitted password with the stored hashed password. A JWT token is generated after successful authentication.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Successful Response:**

Status: `200 OK`

```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "username": "exampleuser",
    "email": "user@example.com"
  }
}
```

**Possible Error Responses:**

Status: `401 Unauthorized`

```json
{
  "message": "Invalid email or password"
}
```

Status: `500 Internal Server Error`

```json
{
  "message": "Login failed"
}
```

**Token Expiration:** 1 hour.

### 5.3 Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Authentication:** Required.

**Description:** Retrieves the profile information of the currently authenticated user.

**Request Header:**

`Authorization: Bearer YOUR_TOKEN`

**Successful Response:**

Status: `200 OK`

```json
{
  "user": {
    "id": 1,
    "username": "exampleuser",
    "email": "user@example.com"
  }
}
```

**Possible Error Responses:**

Status: `401 Unauthorized` – No token provided.

Status: `403 Forbidden` – Invalid or expired token.

Status: `404 Not Found`

```json
{
  "message": "User not found"
}
```

### 5.4 Update Display Name

**Endpoint:** `PUT /api/auth/profile`

**Authentication:** Required.

**Request Body:**

```json
{
  "username": "New display name"
}
```

### 5.5 Get and Update Settings

**Endpoints:** `GET /api/auth/settings`, `PUT /api/auth/settings`

**Authentication:** Required.

Settings include `default_language` (`javascript`, `python`, `java`, `cpp` or `html`), `autosave_delay_ms` (`500`, `1000` or `2000`), `theme` (`dark` or `light`) and `notify_on_share` (boolean). Both endpoints return the settings object.

### 5.6 Change Password

**Endpoint:** `POST /api/auth/change-password`

**Authentication:** Required.

**Request Body:**

```json
{
  "currentPassword": "current_password",
  "newPassword": "new_password_at_least_8_characters"
}
```

### 5.7 Delete Account

**Endpoint:** `DELETE /api/auth/account`

**Authentication:** Required.

**Request Body:**

```json
{
  "currentPassword": "current_password",
  "confirmation": "DELETE"
}
```

Account deletion is blocked while the user owns documents. On success, shared access is removed and the user is anonymized in other users' version history.
## 6. Document Management Endpoints

All endpoints in this section require authentication.

### 6.1 Retrieve All Documents

**Method:** GET

**Endpoint:** `/api/documents`

**Description:** Retrieves all documents owned by or shared with the authenticated user. Each document includes the user's role.

**Headers:**
```http
Authorization: Bearer YOUR_TOKEN
```

**Successful Response (200):**

Returns an array of documents containing their document details and `user_role` (Owner, Editor or Viewer).

**Error Response (500):**
```json
{
  "message": "Error retrieving documents"
}
```

### 6.2 Create a Document

**Method:** POST

**Endpoint:** `/api/documents`

**Description:** Creates a new document owned by the authenticated user.

**Request Body:**
```json
{
  "title": "My Document",
  "type": "Code Editor",
  "content": "",
  "language": "javascript"
}
```

**Fields:**
- `title`: Document title.
- `type`: Document type, such as Code Editor or Whiteboard.
- `content`: Initial document content.
- `language`: Programming language. Defaults to `javascript` if omitted.

**Successful Response (201):**

Returns the newly created document record.

**Error Response (500):**
```json
{
  "message": "Error creating document"
}
```

### 6.3 Retrieve One Document

**Method:** GET

**Endpoint:** `/api/documents/:id`

**Description:** Retrieves a specific document by its ID. The user must own the document or have permission to access it.

**Example:**
`GET /api/documents/9`

**Successful Response (200):**

Returns the document record, including `user_role`.

**Error Responses:**

- **403 Forbidden:** User does not have permission to access the document.
- **404 Not Found:** Document does not exist.
- **500 Internal Server Error:** Error retrieving the document.

## 6. Document Management Endpoints

All document endpoints require authentication.

Include the following header in protected requests:

`Authorization: Bearer YOUR_TOKEN`

### 6.1 Retrieve All Documents

**Method:** GET

**Endpoint:** `/api/documents`

**Description:** Retrieves all documents owned by or shared with the authenticated user.

**Success Response:** `200 OK`

Returns an array of documents containing document information and the user's role (`Owner`, `Editor` or `Viewer`).

**Error Response:**
- `401 Unauthorized` – Missing authentication token.
- `403 Forbidden` – Invalid or expired token.
- `500 Internal Server Error` – Error retrieving documents.

### 6.2 Retrieve One Document

**Method:** GET

**Endpoint:** `/api/documents/:id`

**Description:** Retrieves a specific document using its ID. The user must own the document or have permission to access it.

**Example:** `/api/documents/9`

**Success Response:** `200 OK`

Returns the document information, including its `user_role`.

**Error Responses:**
- `401 Unauthorized` – Missing authentication token.
- `403 Forbidden` – User does not have permission.
- `404 Not Found` – Document does not exist.
- `500 Internal Server Error` – Error retrieving document.

### 6.3 Create a Document

**Method:** POST

**Endpoint:** `/api/documents`

**Description:** Creates a new document owned by the authenticated user.

**Request Body:**

```json
{
  "title": "My Document",
  "type": "Code Editor",
  "content": "",
  "language": "javascript"
}
```

The language field is optional and defaults to `javascript`. Content defaults to an empty string.

**Success Response:** `201 Created`

Returns the newly created document.

**Error Responses:**
- `401 Unauthorized` – Missing authentication token.
- `403 Forbidden` – Invalid or expired token.
- `500 Internal Server Error` – Error creating document.

### 6.4 Update a Document

**Method:** PUT

**Endpoint:** `/api/documents/:id`

**Description:** Updates an existing document. Only Owners and Editors can update documents. A new version is saved after a successful update.

**Request Body:**

```json
{
  "title": "Updated Document",
  "type": "Code Editor",
  "content": "console.log('Hello World');",
  "language": "javascript"
}
```

**Success Response:** `200 OK`

Returns the updated document.

**Error Responses:**
- `401 Unauthorized` – Missing authentication token.
- `403 Forbidden` – User does not have permission or is a Viewer.
- `404 Not Found` – Document does not exist.
- `500 Internal Server Error` – Error updating document.

### 6.5 Delete a Document

**Method:** DELETE

**Endpoint:** `/api/documents/:id`

**Description:** Deletes a document. Only the document Owner can perform this operation.

**Success Response:** `200 OK`

```json
{
  "message": "Document deleted successfully"
}
```

The response also includes the deleted document.

**Error Responses:**
- `401 Unauthorized` – Missing authentication token.
- `403 Forbidden` – User is not the Owner or lacks permission.
- `404 Not Found` – Document does not exist.
- `500 Internal Server Error` – Error deleting document.

### 6.6 Share a Document

**Method:** POST

**Endpoint:** `/api/documents/:id/share`

**Description:** Shares a document with another registered user by email address. Only the Owner can share documents.

**Request Body:**

```json
{
  "email": "user@example.com",
  "role": "Editor"
}
```

The role must be either `Editor` or `Viewer`.

Sharing an existing document with the same user updates their assigned role.
If the recipient opted in to share notifications, the server attempts to email them. If SMTP is unavailable, the document is still shared and the response includes `notificationWarning`.

**Success Response:** `201 Created`

```json
{
  "message": "Document shared successfully",
  "documentId": 9,
  "sharedWith": "user@example.com",
  "role": "Editor"
}
```

**Error Responses:**
- `400 Bad Request` – Invalid role or attempting to share with yourself.
- `401 Unauthorized` – Missing authentication token.
- `403 Forbidden` – Only the Owner can share the document.
- `404 Not Found` – Recipient account does not exist.
- `500 Internal Server Error` – Error sharing document.

## 7. Version History Endpoints

These endpoints allow users to view previous document versions and restore an earlier version.

All version-history endpoints require authentication.

### 7.1 Retrieve Version History

**Method:** GET

**Endpoint:** `/api/documents/:id/versions`

**Description:** Retrieves the version history of a document. Users with access to the document can view its versions.

**Example:** `/api/documents/9/versions`

**Success Response:** `200 OK`

Returns an array of document versions, ordered from newest to oldest.

Each version contains information such as:
- Version ID
- Document ID
- Content
- Programming language
- Version number
- Creation date
- User who created the version

**Error Responses:**
- `401 Unauthorized` – Missing authentication token.
- `403 Forbidden` – User does not have permission to view the document.
- `500 Internal Server Error` – Error retrieving document versions.

### 7.2 Restore a Previous Version

**Method:** POST

**Endpoint:** `/api/documents/:id/versions/:versionId/restore`

**Description:** Restores the selected version of a document. Only Owners and Editors can restore versions.

Restoring a version updates the document's content and programming language. The restoration is also saved as a new version rather than replacing the previous version.

**Example:** `/api/documents/9/versions/1/restore`

**Success Response:** `200 OK`

```json
{
  "message": "Version restored successfully",
  "document": {
    "id": 9,
    "content": "Restored document content",
    "language": "javascript"
  },
  "newVersionNumber": 2
}
```

**Error Responses:**
- `401 Unauthorized` – Missing authentication token.
- `403 Forbidden` – User lacks permission or is a Viewer.
- `404 Not Found` – Requested version does not exist.
- `500 Internal Server Error` – Error restoring document version.

## 8. Real-Time Communication (Socket.IO)

CodeSync uses Socket.IO to support real-time document collaboration.

The Socket.IO server runs at:

`http://localhost:5000`

### 8.1 Socket Authentication

A valid JWT token is required when connecting to the Socket.IO server.

The token is sent through the connection authentication object.

### 8.2 Join a Document

**Event:** `join-document`

**Description:** Allows an authenticated user to join a document's collaboration room.

**Data:** Document ID.

The server checks whether the user has permission to access the document before allowing them to join.

### 8.3 Leave a Document

**Event:** `leave-document`

**Description:** Removes the user from the document's collaboration room when they leave the workspace.

**Data:** Document ID.

### 8.4 Send Document Changes

**Event:** `document-change`

**Description:** Sends updated document content to the server.

**Example Data:**

```json
{
  "documentId": 9,
  "content": "console.log('Hello World');"
}
```

The server checks that the user has joined the document room and has Owner or Editor permissions.

Accepted changes are saved in PostgreSQL and broadcast to other users in the same document room.

### 8.5 Receive Document Changes

**Event:** `receive-change`

**Description:** Notifies other users in the same document room when document content changes.

The receiving frontend uses the updated content to refresh its editor or whiteboard.

### 8.6 Disconnect

**Event:** `disconnect`

**Description:** Triggered when a user disconnects from the Socket.IO server. The server clears the socket's stored document-role information.

## 9. User Roles and Permissions

CodeSync uses role-based access control to manage document access.

The application supports three roles:

| Feature | Owner | Editor | Viewer |
|---|---|---|---|
| View document | Yes | Yes | Yes |
| Edit document | Yes | Yes | No |
| Share document | Yes | No | No |
| Restore versions | Yes | Yes | No |
| Delete document | Yes | No | No |
| View version history | Yes | Yes | Yes |

### 9.1 Owner

The Owner is the user who creates the document.

Owners have full control over their documents, including editing, sharing, restoring previous versions and deleting documents.

### 9.2 Editor

Editors can access and modify shared documents.

They can update document content and restore previous versions, but cannot share or delete documents.

### 9.3 Viewer

Viewers have read-only access to shared documents.

They can open documents and view version history but cannot modify or restore documents, share them or delete them.

### 9.4 Permission Enforcement

Permissions are checked by the backend before protected operations are performed.

The frontend also displays or hides controls according to the user's role. Backend authorization ensures that users cannot perform restricted operations simply by bypassing the frontend.

## 10. Error Handling and Security

### 10.1 HTTP Status Codes

The API uses standard HTTP status codes to communicate the outcome of requests.

| Status Code | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created successfully |
| 400 | Invalid request data |
| 401 | Authentication token missing or login credentials invalid |
| 403 | Access denied or insufficient permissions |
| 404 | Requested resource not found |
| 500 | Internal server error |

### 10.2 Security Measures

CodeSync implements the following security measures:

- Passwords are hashed using bcryptjs before being stored in the database.
- JSON Web Tokens (JWT) are used to authenticate users.
- Protected API routes require a valid authentication token.
- Socket.IO connections require JWT authentication.
- Role-based authorization restricts access to document operations.
- Parameterized SQL queries are used to reduce SQL injection risks.
- Environment variables are used to store sensitive configuration values.

### 10.3 Token Expiration

Authentication tokens expire after one hour.

Users must log in again to obtain a new token after expiration.
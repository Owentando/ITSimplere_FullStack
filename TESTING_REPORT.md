# CodeSync Testing Report

## 1. Introduction

This document presents the testing activities performed on the CodeSync Real-Time Collaborative Code and Whiteboard Editor.

The purpose of testing was to verify that the application's main features operate correctly, that users can collaborate in real time, and that access permissions and data persistence work as expected.

Testing covered the frontend, backend, database, authentication, document management, code editor, whiteboard, version history and real-time communication.

## 2. Testing Environment

The application was developed and tested using the following technologies:

| Component | Technology |
|---|---|
| Frontend | React.js |
| Development Tool | Vite |
| Backend | Node.js and Express.js |
| Database | PostgreSQL |
| Real-time Communication | Socket.IO |
| Code Editor | Monaco Editor |
| Authentication | JSON Web Tokens (JWT) |
| Password Security | bcryptjs |
| Browser | Microsoft Edge |
| Operating System | Windows |

The application was tested locally using two browser windows to verify real-time collaboration.

## 3. Functional Testing

Functional testing was performed to verify that the main application features work according to their requirements.

| Test ID | Feature | Test Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| FT01 | Registration | Register a new user account | Account is created successfully | Account created successfully | Pass |
| FT02 | Login | Log in using valid credentials | User is authenticated and redirected to the dashboard | Login successful | Pass |
| FT03 | Document Creation | Create a new code document | Document is saved and displayed on the dashboard | Document created successfully | Pass |
| FT04 | Code Editor | Enter and edit code | Code appears correctly in the editor | Code editing works correctly | Pass |
| FT05 | Language Selection | Change the programming language | Editor updates syntax highlighting | Language selection works correctly | Pass |
| FT06 | Code Persistence | Refresh and reopen a code document | Previously saved code remains available | Code persisted successfully | Pass |
| FT07 | Whiteboard Drawing | Draw freehand and create shapes | Drawings and shapes appear on the canvas | Drawing tools worked correctly | Pass |
| FT08 | Whiteboard Editing | Select, move, resize and delete objects | Selected objects respond to the available tools | Object editing worked correctly | Pass |
| FT09 | Whiteboard History | Test undo and redo | Previous canvas actions can be reversed and restored | Undo and redo worked correctly | Pass |
| FT10 | Whiteboard Zoom | Change the canvas zoom level | Canvas zoom changes correctly | Zoom worked correctly | Pass |
| FT11 | Whiteboard Persistence | Save drawings, refresh and reopen | Previously saved drawings remain available | Drawings persisted successfully | Pass |
| FT12 | Document Sharing | Share a document with another user | Selected user receives the assigned role | Sharing worked correctly | Pass |
| FT13 | Version History | Open a document's version history | Previous versions are displayed | Version history worked correctly | Pass |
| FT14 | Version Restoration | Restore a previous version | Document is restored and a new version is created | Restoration worked correctly | Pass |
| FT15 | Logout | Log out of the application | Session ends and protected pages require authentication | Logout and session protection worked correctly | Pass |
| FT16 | Database Persistence | Restart the backend and retrieve saved code | Previously saved content remains available | Saved code remained available | Pass |

## 4. Real-Time Collaboration Testing

Real-time collaboration was tested using two browser windows connected to the same document.

| Test ID | Test Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| RTC01 | Edit code in Browser 1 | Changes appear in Browser 2 without refreshing | Changes appeared in the second browser | Pass |
| RTC02 | Edit code in Browser 2 | Changes appear in Browser 1 without refreshing | Changes appeared in the first browser | Pass |
| RTC03 | Draw on the whiteboard in Browser 1 | Drawing appears in Browser 2 | Drawing appeared in the second browser | Pass |
| RTC04 | Draw on the whiteboard in Browser 2 | Drawing appears in Browser 1 | Drawing appeared in the first browser | Pass |
| RTC05 | Switch between documents | Previous room is left and the selected room is joined | Room switching worked correctly | Pass |

These tests confirmed that Socket.IO successfully transmitted document changes between connected users.

## 5. Security and Role-Based Access Testing

Security testing was performed to verify authentication, authorization and document permissions.

| Test ID | User Role | Test Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| ST01 | Owner | Edit an owned document | Owner can edit the document | Editing allowed | Pass |
| ST02 | Owner | Share a document | Owner can share with another registered user | Sharing allowed | Pass |
| ST03 | Owner | Delete an owned document | Owner can delete the document | Deletion allowed | Pass |
| ST04 | Editor | Edit a shared document | Editor can update document content | Editing allowed | Pass |
| ST05 | Editor | Restore a previous version | Editor can restore document versions | Restoration allowed | Pass |
| ST06 | Editor | Delete a shared document | Editor cannot delete the document | Request rejected | Pass |
| ST07 | Editor | Share a document | Editor cannot share the document | Request rejected | Pass |
| ST08 | Viewer | Open a shared document | Viewer can read the document | Access allowed | Pass |
| ST09 | Viewer | Update document content | Viewer cannot edit the document | Request rejected | Pass |
| ST10 | Viewer | Restore a previous version | Viewer cannot restore versions | Request rejected | Pass |
| ST11 | Viewer | Share or delete a document | Viewer cannot share or delete documents | Actions restricted | Pass |
| ST12 | Unauthenticated User | Access a protected API endpoint | Request is rejected | Access denied | Pass |
| ST13 | Invalid Token | Access a protected API endpoint | Request is rejected | Access denied | Pass |
| ST14 | Unauthorized User | Access another user's private document | Access is denied | Request rejected | Pass |

## 6. API Error Handling Testing

The following API error scenarios were tested:

| Test ID | Scenario | Expected HTTP Status | Result |
|---|---|---|---|
| API01 | Request without authentication token | 401 Unauthorized | Tested |
| API02 | Request with invalid or expired token | 403 Forbidden | Tested |
| API03 | Request for a nonexistent document | 404 Not Found | Tested |
| API04 | Request for a document without permission | 403 Forbidden | Tested |

The backend returned appropriate error messages for the tested scenarios.

## 7. Testing Limitations and Known Issues

Although the main application features were tested successfully, some advanced requirements remain incomplete or require further testing.

The following limitations were identified:

1. **Conflict Resolution:** Advanced CRDT or Operational Transformation algorithms have not yet been implemented. Simultaneous editing conflicts may therefore occur when multiple users modify the same content.

2. **Offline Synchronization:** Offline editing and automatic synchronization after reconnecting have not been fully implemented or tested.

3. **Whiteboard History Synchronization:** Undo and redo operations have been tested locally, but synchronization of undo and redo history across multiple users has not been fully verified.

4. **Scalability:** Multi-server Socket.IO scaling using a shared message broker or pub/sub system has not been implemented.

5. **Performance Testing:** Large numbers of simultaneous users and high-volume editing scenarios have not yet been tested.

6. **Automated Testing:** The tests documented in this report were primarily performed manually. A comprehensive automated testing suite has not yet been implemented.

These limitations represent areas for future development and improvement.

## 8. Conclusion

The testing activities confirmed that the main CodeSync application features operate as expected.

User authentication, document management, role-based permissions, code editing, whiteboard functionality, version history, database persistence and real-time collaboration were tested successfully.

The application demonstrated successful communication between two browser windows and correctly enforced the tested Owner, Editor and Viewer permissions.

Further development and testing are required to improve advanced conflict resolution, offline synchronization, scalability and performance.
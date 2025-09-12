# smartsheet-project
A simple and professional web application for managing project tasks using Smartsheet integration. The app allows users to add, update, and track tasks with fields like task name, assignee, progress, start date, and end date. It is designed with a clean UI and supports automation to improve project management efficiency.

## Setup with Docker

### Prerequisites
- Docker installed on your system
- Docker Compose installed

### Running the Application
1. Clone or navigate to the project directory.
2. Build and run the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Open your browser and go to `http://localhost:8080` to access the application.

### Notes
- The frontend is served by nginx on port 8080.
- The application expects a backend API running on `http://127.0.0.1:8000`. Make sure to have the backend server running separately.
- For development, the volume mount allows live reloading of changes.

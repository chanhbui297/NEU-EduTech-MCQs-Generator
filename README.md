> **An advanced AI-powered platform designed for educators to automatically generate, edit, and export standardized Multiple-Choice Questions (MCQs) from academic materials.**

---

## Overview

**NEU EduTech AI** solves a major pain point for lecturers and teachers: the time-consuming process of creating quizzes. By leveraging cutting-edge Large Language Models (LLMs) and specialized educational workflows, the platform transforms static documents (PDF/DOCX) into interactive, platform-ready assessments in seconds.

Built with a focus on the **National Economics University (NEU)** ecosystem, it supports direct exporting to **NEU LMS (Moodle)**, **Quizizz**, **Kahoot**, and **Quizlet**.

---

## Key Features

### 1. AI-Driven Question Generation
*   **Smart Document Extraction**: Uses RAG (Retrieval-Augmented Generation) patterns via Dify to "read" and understand complex academic PDFs.
*   **Customizable Prompts**: Define the number of questions, difficulty level (Bloom's Taxonomy), and focus areas.
*   **Multilingual Support**: Optimized for Vietnamese and English academic content.

### 2. Interactive Review & Edit
*   **Full-Featured Editor**: A sleek UI to modify questions, adjust distractors, and set correct answers before exporting.
*   **Real-time Validation**: Ensures all questions meet platform requirements (e.g., minimum 2 options, correct answer selected).

### 3. Multi-Platform Export Engine
*   **Quizizz**: Generates formatted Excel (.xlsx) files for bulk import.
*   **NEU LMS / Moodle**: Generates XML files with proper grading fractions and HTML formatting.
*   **Kahoot**: Generates professional PDF question sheets.
*   **Quizlet**: Generates Tab-separated (.txt) files for flashcard creation.

###  4 Premium UX/UI
*   **Modern Interface**: Built with Tailwind CSS and Shadcn UI.
*   **Dark Mode**: Optimized for long working hours.
*   **Responsive Design**: Seamless experience across Desktop and Tablet.

---

## 🛠 Tech Stack

### Backend (The Brain)
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
*   **Data Processing**: Pandas, OpenPyXL
*   **PDF Generation**: FPDF2, PyPDF
*   **AI Integration**: Dify API Client (LLM Orchestration)

### Frontend (The Face)
*   **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + Shadcn UI
*   **State Management**: React Hooks + Context API

### Infrastructure & DevOps
*   **Containerization**: Docker & Docker Compose
*   **Reverse Proxy**: Nginx
*   **Environment**: Cross-platform (Windows/Linux/MacOS)


## Getting Started

### Prerequisites
*   Docker & Docker Compose
*   Dify API Key (Local or Cloud)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone git@github.com:chanhbui297/NEU-EduTech-MCQs-Generator.git
    cd NEU-EduTech-MCQs-Generator
    ```

2.  **Configure Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    DIFY_API_KEY=your_dify_api_key_here
    DIFY_API_URL=http://your-dify-host/v1/chat-messages
    ```

3.  **Run with Docker**:
    ```bash
    docker-compose up --build
    ```

4.  **Access the application**:
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:8000/docs`


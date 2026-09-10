# 📱 Smart Task Manager

A **Smart Task Manager mobile application** built with **React Native** to help users create, organize, prioritize, and manage their daily tasks efficiently.

The app provides a simple and user-friendly interface for managing tasks based on their **priority, completion status, and deadlines**.

## ✨ Features

* 🔐 User Authentication
* 📝 Create, edit, and delete tasks
* ✅ Mark tasks as completed
* 🚦 Task priority management

  * High
  * Medium
  * Low
* 📅 Set task due dates
* 🤖 AI-powered task prioritization
* 🔄 Real-time task updates
* 📱 Responsive mobile UI
* 🚪 Secure logout
* 🔗 REST API integration

## 🛠️ Tech Stack

### Frontend

* React Native
* JavaScript
* React Navigation
* Axios

### Backend

* Java
* Spring Boot
* REST APIs
* JWT Authentication

### Database

* MySQL

### AI

* Google Gemini API

### Tools

* Git & GitHub
* Postman
* VS Code

## 🏗️ Application Flow

```text
React Native App
       ↓
   REST APIs
       ↓
  Spring Boot
       ↓
     MySQL
       ↓
   Gemini AI
```

## 🤖 AI Task Prioritization

The application uses **Google Gemini API** to intelligently analyze task information such as the task description and deadline.

Based on the provided information, the AI can suggest an appropriate priority for the task.

Users can also manually change the suggested priority according to their requirements.

## 📱 Main Screens

* Login / Signup
* Home / Task Dashboard
* Add Task
* Edit Task
* Task Details
* Profile / Logout

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/smart-task-manager.git
```

### 2. Navigate to the project

```bash
cd smart-task-manager
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the application

```bash
npx react-native start
```

For Android:

```bash
npx react-native run-android
```

## 🔑 Environment Variables

Create a `.env` file and configure the required API values:

```env
API_BASE_URL=your_backend_url
GEMINI_API_KEY=your_gemini_api_key
```

> Never commit API keys or other sensitive credentials to GitHub.

## 📂 Project Structure

```text
smart-task-manager/
│
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── utils/
│   └── assets/
│
├── App.js
├── package.json
└── README.md
```

## 🔮 Future Improvements

* 🔔 Push notifications for upcoming deadlines
* 📊 Task analytics and productivity statistics
* 🌙 Dark mode
* 🔄 Offline task support
* 👥 Task sharing and collaboration
* 🎙️ Voice-based task creation

## 👨‍💻 Author

**Anmol Bajpai**

* GitHub: [anmolbajpai](https://github.com/anmolbajpai)
* LinkedIn: [Anmol Bajpai](https://linkedin.com/in/anmolbajpai1)
* Email: [anmolbajpai164@gmail.com](mailto:anmolbajpai164@gmail.com)

## 📄 License

This project is developed for learning, portfolio, and demonstration purposes.

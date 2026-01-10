# 🧠 KnowledgeAdda - AI Mentor Microservice

A high-performance **AI Microservice** built for the KnowledgeAdda platform. This backend powers the **UPSC AI Mentor**, providing intelligent Q&A, study material retrieval (RAG), and automated quiz generation.

It is designed as an **independent microservice** that connects to the main application via REST APIs and shared JWT authentication.

---

## 🚀 Tech Stack

| Component | Technology | Purpose |
| --- | --- | --- |
| **Runtime** | Node.js & Express.js | API Server & Routing |
| **LLM Provider** | **Groq** (Llama-3.3-70b) | Ultra-fast inference for Chat & Quizzes |
| **Vector DB** | **Pinecone** | Storing & retrieving study material embeddings (RAG) |
| **Orchestration** | LangChain.js | Managing LLM chains, prompts, and flows |
| **Database** | MongoDB (Mongoose) | Storing Chat History & User Sessions |
| **Auth** | JWT (Shared Secret) | Secure communication with the Main App |


## 🛠️ Architecture & Workflow

This service uses a **Hybrid RAG (Retrieval-Augmented Generation)** architecture with intelligent routing.

### **The Request Flow:**

1. **Incoming Request:**
* The API receives a user query (`POST /chat`).
* **Security Layer:** Checks if the user is a **Guest** or **Registered**.
* *Guest:* Checks rate limits (5 msgs/day) & blocks Premium features (Quizzes).
* *Registered:* Validates JWT and allows full access.


2. **Intent Classification:**
* **Fast Path:** Uses Regex to instantly detect if the user wants a **Quiz** (`"Give me a quiz on..."`) or **Explanation**.
* **Slow Path:** If unclear, asks an LLM to classify the intent.


3. **General Chat Filter:**
* If the user says *"Hi"*, *"Hello"*, or *"Help"*, the system skips the database search to save resources and replies instantly.


4. **Optimized RAG Pipeline (For Questions):**
* **Query Rephrasing:** An LLM rewrites the user's messy question (e.g., *"tell me about 1857 failure"*) into a clean search query (`"Causes of failure 1857 revolt"`).
* **Vector Search:** Searches **Pinecone** for the top 3-4 most relevant study documents.
* **Context Injection:** Feeds the found documents + the user's question to the **Explanation LLM**.


5. **Response Generation:**
* **Groq** generates a structured response (Markdown or JSON).
* The response is saved to MongoDB for history.
* Sent back to the client.

## 📂 Project Structure

server/
├── src/
│   ├── config/             # DB & Env Configurations
│   ├── controllers/        # Request Handlers (Guest Logic lives here)
│   ├── models/             # Mongoose Schemas (Chat, Session)
│   ├── prompts/
│   ├── routes/             # API Endpoints
│   ├── services/
│   │   ├── llm/            # LangChain Logic
│   │   │   ├── explanationGenerator.js  # RAG Chain
│   │   │   ├── quizGenerator.js         # Quiz JSON Chain
│   │   │   ├── intentClassifier.js      # Intent Detection
│   │   │   ├── queryProcessor.js        # Query Rephraser
│   │   │   └── 
│   │   ├── mentor/     # Main Service Layer (Orchestrator)
│   │   └──  rag/       # document injection 
│   └── app.js              # Entry Point
└── .env                    # Environment Variables


## ⚡ Key Features

### 1. **Guest vs. Registered Logic**

* **Guests:** Identified by a UUID stored in LocalStorage.
  * **Limit:** Max 5 messages per day (Tracked via MongoDB).
  * **Restriction:** Cannot generate Quizzes.

* **Registered Users:** Identified via JWT Token from the Main App.
  * **Access:** Unlimited messages & Quizzes.


### 2. **Smart Quiz Generator**

* Generates 5 multiple-choice questions based on any topic.
* Returns strictly formatted JSON for the Frontend to render interactively.
* **Model:** Uses `llama-3.3-70b` with low temperature for strict adherence to JSON schema.

### 3. **Self-Correcting RAG**
* If a user asks a vague question, the **Query Processor** rewrites it before searching the database, ensuring high-quality retrieval results even for poor inputs.


## 🔧 Installation & Setup

### 1. Prerequisites
* Node.js (v18+)
* MongoDB (Local or Atlas)
* Pinecone Account (Free Tier)
* Groq API Key (Free Beta)

### 2. Clone & Install
```bash
git clone <repo-url>
cd server
npm install

```

### 3. Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
PORT=5000

# Security 
JWT_SECRET=your_shared_secret_key

# AI Providers
GROQ_API_KEY=gsk_your_groq_key_here
PINECONE_API_KEY=pcsk_your_pinecone_key
PINECONE_INDEX=knowledge-index

# Models
QUIZ_MODEL=llama-3.3-70b-versatile
EXPLANATION_MODEL=llama-3.3-70b-versatile
```


### 4. Run the Server
```bash
# Development Mode (Auto-restart)
npm run dev

# Production
npm start

```

## 📡 API Documentation

### **1. Chat Interaction**
* **Endpoint:** `POST /api/mentor/chat`
* **Headers:**
* `Content-Type: application/json`
* `Authorization: Bearer <TOKEN>` (Optional: If missing, treated as Guest)


* **Body:**
```json
{
  "query": "Explain the role of Constituent Assembly",
  "sessionId": "uuid-string-from-frontend"
}

```

* **Response (Success):**
```json
{
  "success": true,
  "type": "EXPLAIN",
  "data": "**Constituent Assembly** stands for...",
  "sources": [{"title": "UPSC PDF", "url": "..."}],
  "isGuest": false
}

```


* **Response (Guest Limit Reached):**
```json
{
  "success": false,
  "msg": "🔒 Daily Guest Limit Reached (5/5). Please Login!",
  "isGuest": true
}

```



### **2. Get Chat History**

* **Endpoint:** `GET /api/mentor/history/:sessionId`
* **Description:** Fetches previous conversation context for the UI.

---

## 🧪 Testing
You can test the Guest Limitations using Postman:

1. **No Auth Header:** Send 6 requests to trigger the limit.
2. **Quiz Request (Guest):** Ask "Give me a quiz" without a token -> Returns `403 Forbidden`.
3. **Quiz Request (Auth):** Add `Authorization` header -> Returns Quiz JSON.

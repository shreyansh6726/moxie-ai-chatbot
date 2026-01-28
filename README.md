# Moxie-chat-bot 

Moxie is a minimalist, high-performance chatbot built with **React.js** and powered by the **Groq LPU™ Inference Engine**. It features a "decent," distraction-free UI designed for speed and clarity.

##  Features
* **Minimalist Design:** A clean, focused interface for seamless conversations.
* **Ultra-fast Responses:** Powered by Groq's low-latency API.
* **Responsive UI:** Optimized for both desktop and mobile browsing.
* **Edge Deployment:** Optimized for instant loading via Vercel.

##  Tech Stack
* **Frontend:** React.js
* **AI Engine:** Groq Cloud API (Llama 3 / Mixtral)
* **Deployment:** Vercel
* **Styling:** CSS3 / Tailwind (Minimalist approach)

##  Getting Started

### Prerequisites
* Node.js (v18 or higher)
* A Groq API Key (Get one at [console.groq.com](https://console.groq.com/))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/moxie-chat-bot.git](https://github.com/your-username/moxie-chat-bot.git)
    cd moxie-chat-bot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory and add your Groq API key:
    ```env
    REACT_APP_GROQ_API_KEY=your_api_key_here
    ```

4.  **Run the app:**
    ```bash
    npm start
    ```

##  Project Structure
The core logic resides in `src/chat.js`, which handles the asynchronous requests to the Groq API and manages the conversation state.

```text
src/
├── components/
│   └── ChatInterface.js  # Minimalist UI components
├── chat.js               # Groq API integration logic
├── App.js                # Main application entry
└── index.css             # Global styling & reset
```

##Deployment
This project is configured for easy deployment on Vercel:

Push your code to a GitHub repository.

Import the project into the Vercel Dashboard.

Add your REACT_APP_GROQ_API_KEY in the Environment Variables section of the Vercel project settings.

Click Deploy.

 License
This project is open-source and available under the MIT License.

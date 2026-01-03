import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Import the markdown library
import './ChatbotUI.css';

const ChatbotUI = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your Moxie AI assistant developed by Shreyansh. How can I help you today?", sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      history.push({ role: 'user', content: currentInput });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: data.text, sender: 'bot' },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "I'm having trouble connecting. Please try again.", sender: 'bot' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container-wrapper">
      <div className="chat-card">
        
        {/* Simplified Header */}
        <div className="chat-header">
          <div className="bot-info">
            <div className="bot-avatar">
              <Bot size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Moxie AI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot"></span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className={`message-bubble ${msg.sender}`}>
                {/* Use ReactMarkdown for the bot's messages.
                  We keep the user's message as text for security/simplicity.
                */}
                {msg.sender === 'bot' ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message-row bot">
              <div className="message-bubble bot" style={{ display: 'flex', gap: '4px', alignItems: 'center', opacity: 0.7 }}>
                <span className="typing-dot"></span>
                <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
                <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="chat-input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
              disabled={isLoading}
              style={{ paddingLeft: '16px' }}
            />
            <button 
              type="submit" 
              className="send-button" 
              disabled={isLoading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#9ca3af', marginTop: '8px' }}>
            Developed by Shreyansh
          </div>
        </form>

      </div>
    </div>
  );
};

export default ChatbotUI;
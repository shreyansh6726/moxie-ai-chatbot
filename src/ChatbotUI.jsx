import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Copy, Check, Moon, Sun, Paperclip } from 'lucide-react'; // Added Paperclip
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatbotUI.css';

const CodeBlock = ({ language, children, isDarkMode }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const codeText = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-container">
      <div className="code-header">
        <span className="code-language">{language || 'code'}</span>
        <button onClick={handleCopy} className="copy-button">
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDarkMode ? oneDark : oneLight}
        customStyle={{ margin: 0, padding: '15px', fontSize: '13px', background: 'transparent' }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatbotUI = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your Moxie AI assistant developed by Shreyansh. How can I help you today?", sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for hidden file input

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle .txt file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      alert("Please upload a .txt file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setInput((prev) => `${prev}\n\n[File Content: ${file.name}]\n${content}\n\n`);
    };
    reader.readAsText(file);
    // Reset file input so same file can be uploaded again
    e.target.value = null;
  };

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
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "I'm having trouble connecting. Please try again.", sender: 'bot' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-container-wrapper ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="chat-card">
        
        <div className="chat-header">
          <div className="bot-info">
            <div className="bot-avatar"><Bot size={22} /></div>
            <div>
              <div className="header-title">Moxie AI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot"></span>
                <span className="status-text">Online</span>
              </div>
            </div>
          </div>
          <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div ref={scrollRef} className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className={`message-bubble ${msg.sender}`}>
                {msg.sender === 'bot' ? (
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <CodeBlock language={match ? match[1] : ''} isDarkMode={isDarkMode}>
                              {children}
                            </CodeBlock>
                          ) : (
                            <code className={className} {...props}>{children}</code>
                          )
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="message-row bot"><div className="typing-dot"></div></div>}
        </div>

        <form onSubmit={handleSend} className="chat-input-form">
          <div className="input-wrapper">
            {/* Hidden File Input */}
            <input 
              type="file" 
              accept=".txt" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            {/* Attachment Button */}
            <button 
              type="button" 
              className="attach-button" 
              onClick={() => fileInputRef.current.click()}
              disabled={isLoading}
            >
              <Paperclip size={20} />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "AI is thinking..." : "Type or upload a .txt file..."}
              disabled={isLoading}
              rows="1"
            />
            
            <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotUI;
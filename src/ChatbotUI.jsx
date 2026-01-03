import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Copy, Check, Moon, Sun, Paperclip, FileText, X, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatbotUI.css';

// --- PDF.js Worker Configuration ---
import * as pdfjsLib from 'pdfjs-dist';
// This import ensures the worker is bundled correctly by your build tool (Vite/Webpack)
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Custom Component for Code Blocks with Syntax Highlighting & Copy Button
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
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Voice Logic ---
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang.includes('en')) || voices[0];
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // --- Auto Scroll ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // --- PDF & TXT Extraction Logic ---
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileInfo = {
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      type: file.type
    };

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({ ...fileInfo, content: event.target.result });
      };
      reader.readAsText(file);
    } 
    else if (file.type === "application/pdf") {
      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(" ");
          fullText += pageText + "\n";
        }

        setAttachedFile({ ...fileInfo, content: fullText });
      } catch (error) {
        console.error("PDF Error:", error);
        alert("Error parsing PDF. Please make sure it's not password protected.");
      } finally {
        setIsLoading(false);
      }
    } 
    else {
      alert("Only .txt and .pdf files are supported.");
    }
    e.target.value = null;
  };

  // --- Send Message ---
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage = { 
      id: Date.now(), 
      text: input, 
      sender: 'user',
      file: attachedFile 
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Construct instructions for the AI model to process the attachment
    const aiPrompt = attachedFile 
      ? `[File Attached: ${attachedFile.name}]\n\nContent:\n${attachedFile.content}\n\nUser Question: ${input || "Please analyze this file."}`
      : input;

    setInput('');
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      history.push({ role: 'user', content: aiPrompt });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: data.text, sender: 'bot' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: "Connection error. Please try again.", sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-container-wrapper ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="chat-card">
        
        {/* Header Section */}
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
          
          <div className="header-actions">
            {isSpeaking && (
              <button className="stop-speech-button" onClick={stopSpeech} title="Stop Speaking">
                <VolumeX size={20} />
              </button>
            )}
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div ref={scrollRef} className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className={`message-bubble ${msg.sender}`}>
                {/* Render File Attachment Card */}
                {msg.file && (
                  <div className="file-attachment-card">
                    <FileText size={24} className="file-icon" />
                    <div className="file-info">
                      <div className="file-name">{msg.file.name}</div>
                      <div className="file-size">{msg.file.size}</div>
                    </div>
                  </div>
                )}
                
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
                    <button className="speak-button" onClick={() => speak(msg.text)} title="Listen">
                      <Volume2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="message-row bot"><div className="typing-dot"></div></div>}
        </div>

        {/* Input & Upload Section */}
        <form onSubmit={handleSend} className="chat-input-form">
          {attachedFile && (
            <div className="file-preview-bar">
              <div className="preview-card">
                <FileText size={16} />
                <span>{attachedFile.name}</span>
                <button type="button" onClick={() => setAttachedFile(null)}><X size={14} /></button>
              </div>
            </div>
          )}

          <div className="input-wrapper">
            <input 
              type="file" 
              accept=".txt,.pdf" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />
            <button 
              type="button" 
              className="attach-button" 
              onClick={() => fileInputRef.current.click()} 
              disabled={isLoading}
              title="Attach File"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "Processing..." : "Type a message..."}
              disabled={isLoading}
            />
            <button type="submit" className="send-button" disabled={isLoading || (!input.trim() && !attachedFile)}>
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
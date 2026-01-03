import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Copy, Check, Moon, Sun, Paperclip, FileText, X, Volume2, VolumeX, Mic, MicOff, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatbotUI.css';

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
    { id: 1, text: "Hello! I'm your Moxie AI assistant. How can I help you today?", sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // --- Voice Switching State ---
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load available system voices
  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // --- Speech to Text (Voice Input) ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.start();
  };

  // --- Voice Functions (Output) ---
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_~]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Apply selected voice
    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "text/plain") return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({ name: file.name, content: event.target.result, size: (file.size / 1024).toFixed(1) + " KB" });
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user', file: attachedFile };
    setMessages((prev) => [...prev, userMessage]);
    
    const aiPrompt = attachedFile ? `[File: ${attachedFile.name}]\nContent:\n${attachedFile.content}\n\nUser Question: ${input}` : input;
    setInput('');
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }));
      history.push({ role: 'user', content: aiPrompt });
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) });
      const data = await response.json();
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: data.text, sender: 'bot' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: "Connection error.", sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-container-wrapper ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="chat-card">
        
        {/* Header */}
        <div className="chat-header">
          <div className="bot-info">
            <div className="bot-avatar"><Bot size={22} /></div>
            <div>
              <div className="header-title">Moxie AI</div>
              <div className="voice-selector-container">
                <select 
                  className="voice-select" 
                  value={selectedVoiceIndex} 
                  onChange={(e) => setSelectedVoiceIndex(e.target.value)}
                >
                  {voices.map((voice, index) => (
                    <option key={index} value={index}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            {isSpeaking && <button className="stop-speech-button" onClick={stopSpeech}><VolumeX size={20} /></button>}
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className={`message-bubble ${msg.sender}`}>
                {msg.file && (
                  <div className="file-attachment-card">
                    <FileText size={24} className="file-icon" />
                    <div className="file-info"><div className="file-name">{msg.file.name}</div><div className="file-size">{msg.file.size}</div></div>
                  </div>
                )}
                {msg.sender === 'bot' ? (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline ? <CodeBlock language={match ? match[1] : ''} isDarkMode={isDarkMode}>{children}</CodeBlock> : <code className={className} {...props}>{children}</code>
                    }}}>{msg.text}</ReactMarkdown>
                    <button className="speak-button" onClick={() => speak(msg.text)}><Volume2 size={16} /></button>
                  </div>
                ) : <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>}
              </div>
            </div>
          ))}
          {isLoading && <div className="message-row bot"><div className="typing-dot"></div></div>}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="chat-input-form">
          {attachedFile && (
            <div className="file-preview-bar">
              <div className="preview-card"><FileText size={16} /><span>{attachedFile.name}</span><button type="button" onClick={() => setAttachedFile(null)}><X size={14} /></button></div>
            </div>
          )}
          <div className="input-wrapper">
            <input type="file" accept=".txt" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
            <button type="button" className="attach-button" onClick={() => fileInputRef.current.click()} disabled={isLoading}><Paperclip size={20} /></button>
            <button type="button" className={`mic-button ${isListening ? 'listening' : ''}`} onClick={startListening} disabled={isLoading}>
              {isListening ? <MicOff size={20} color="#ef4444" /> : <Mic size={20} />}
            </button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Type a message..."} disabled={isLoading} />
            <button type="submit" className="send-button" disabled={isLoading || (!input.trim() && !attachedFile)}><Send size={18} /></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotUI;
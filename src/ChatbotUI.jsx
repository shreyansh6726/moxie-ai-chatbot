import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, Copy, Check, Moon, Sun, Paperclip, FileText, 
  X, Volume2, VolumeX, Mic, MicOff, Trash2, ChevronDown 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, children, isDarkMode }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    const codeText = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeStyles = {
    container: { margin: '15px 0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
    header: { backgroundColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    language: { color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },
    copyButton: { background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', transition: '0.2s' }
  };

  return (
    <div style={codeStyles.container}>
      <div style={codeStyles.header}>
        <span style={codeStyles.language}>{language || 'code'}</span>
        <button onClick={handleCopy} style={codeStyles.copyButton}>
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter language={language} style={isDarkMode ? oneDark : oneLight} customStyle={{ margin: 0, padding: '15px', fontSize: '13px', background: 'transparent' }}>
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatbotUI = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('moxie_messages');
    return saved ? JSON.parse(saved) : [{ id: 1, text: "Hello! I'm your Moxie AI assistant. How can I help you today?", sender: 'bot' }];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('moxie_theme') === 'dark');
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(() => parseInt(localStorage.getItem('moxie_voice_index')) || 0);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const voiceMenuRef = useRef(null);

  const theme = isDarkMode ? {
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 50%, #500724 100%)',
    cardBg: 'rgba(15, 23, 42, 0.9)',
    headerBg: 'rgba(30, 41, 59, 0.6)',
    textMain: '#f8fafc',
    textSub: '#94a3b8',
    botBubbleBg: '#1e293b',
    botBubbleText: '#e2e8f0',
    botBubbleBorder: 'rgba(255, 255, 255, 0.1)',
    userBubbleBg: '#6366f1',
    userBubbleText: '#ffffff',
    inputAreaBg: '#0f172a',
    inputWrapperBg: '#1e293b',
    inputBorder: '#334155',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
  } : {
    bgGradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    headerBg: 'rgba(255, 255, 255, 0.6)',
    textMain: '#1f2937',
    textSub: '#6b7280',
    botBubbleBg: '#ffffff',
    botBubbleText: '#374151',
    botBubbleBorder: 'rgba(0, 0, 0, 0.05)',
    userBubbleBg: '#4f46e5',
    userBubbleText: '#ffffff',
    inputAreaBg: '#ffffff',
    inputWrapperBg: '#f8fafc',
    inputBorder: '#e2e8f0',
    cardBorder: 'rgba(255, 255, 255, 0.4)',
  };

  const styles = {
    wrapper: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh',
      background: theme.bgGradient, fontFamily: "'Inter', sans-serif", transition: 'all 0.5s ease', padding: '20px'
    },
    card: {
      width: '100%', maxWidth: '450px', height: '650px', background: theme.cardBg,
      backdropFilter: 'blur(15px)', borderRadius: '28px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${theme.cardBorder}`
    },
    header: {
      padding: '16px 24px', background: theme.headerBg, borderBottom: `1px solid ${theme.botBubbleBorder}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    botAvatar: {
      width: '40px', height: '40px', background: '#4f46e5', borderRadius: '12px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
    },
    messagesArea: {
      flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
    },
    userBubble: {
      alignSelf: 'flex-end', maxWidth: '85%', padding: '12px 16px', fontSize: '15px', borderRadius: '18px 18px 4px 18px',
      background: theme.userBubbleBg, color: theme.userBubbleText, boxShadow: '0 4px 15px rgba(79, 70, 229, 0.2)'
    },
    botBubble: {
      alignSelf: 'flex-start', maxWidth: '85%', padding: '12px 16px', fontSize: '15px', borderRadius: '18px 18px 18px 4px',
      background: theme.botBubbleBg, color: theme.botBubbleText, border: `1px solid ${theme.botBubbleBorder}`
    },
    inputForm: { padding: '20px', background: theme.inputAreaBg, borderTop: `1px solid ${theme.botBubbleBorder}` },
    inputWrapper: {
      display: 'flex', alignItems: 'center', background: theme.inputWrapperBg,
      border: `1px solid ${theme.inputBorder}`, borderRadius: '24px', padding: '4px 8px'
    },
    textInput: { flex: 1, background: 'transparent', border: 'none', padding: '10px 12px', outline: 'none', fontSize: '16px', color: theme.textMain },
    voiceMenu: {
      position: 'absolute', top: '100%', left: 0, width: '200px', maxHeight: '250px',
      background: theme.cardBg, border: `1px solid ${theme.botBubbleBorder}`, borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', overflowY: 'auto', zIndex: 100, padding: '6px'
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => { if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target)) setIsVoiceMenuOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('moxie_messages', JSON.stringify(messages));
    localStorage.setItem('moxie_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('moxie_voice_index', selectedVoiceIndex);
  }, [messages, isDarkMode, selectedVoiceIndex]);

  useEffect(() => {
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const getCleanName = (name) => name.replace(/Microsoft|Google|Apple|Desktop|Natural/g, '').replace(/-/g, '').trim();

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => setInput(p => p + e.results[0][0].transcript);
    recognition.start();
  };

  const speak = (text, voiceIndex = selectedVoiceIndex) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_~]/g, ''));
    if (voices[voiceIndex]) utterance.voice = voices[voiceIndex];
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;
    const userMsg = { id: Date.now(), text: input, sender: 'user', file: attachedFile };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setAttachedFile(null); setIsLoading(true);
    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })) }) 
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, text: data.text, sender: 'bot' }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Connection error.", sender: 'bot' }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes fadeInSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .msg-animate { animation: fadeInSlide 0.4s ease-out forwards; }
        .stop-pulse { animation: stopPulse 2s infinite; }
        @keyframes stopPulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        @keyframes pulseMic { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        .mic-active { animation: pulseMic 1.5s infinite; background: rgba(239, 68, 68, 0.1) !important; }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.botAvatar}><Bot size={22} /></div>
            <div>
              <div style={{ fontWeight: 'bold', color: theme.textMain }}>Moxie AI</div>
              <div style={{ position: 'relative' }} ref={voiceMenuRef}>
                <button 
                  style={{ background: 'transparent', border: 'none', color: theme.textSub, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
                >
                  {voices[selectedVoiceIndex] ? getCleanName(voices[selectedVoiceIndex].name) : "Select Voice"}
                  <ChevronDown size={12} />
                </button>
                {isVoiceMenuOpen && (
                  <div style={styles.voiceMenu}>
                    {voices.map((v, i) => (
                      <button 
                        key={i} 
                        style={{ width: '100%', textAlign: 'left', padding: '8px', border: 'none', background: selectedVoiceIndex === i ? 'rgba(79, 70, 229, 0.1)' : 'transparent', color: theme.textMain, fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => { setSelectedVoiceIndex(i); setIsVoiceMenuOpen(false); }}
                      >
                        {getCleanName(v.name)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isSpeaking && (
              <button className="stop-pulse" style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }}>
                <VolumeX size={20} />
              </button>
            )}
            <button style={{ background: 'transparent', border: 'none', color: theme.textSub, cursor: 'pointer' }} onClick={() => setMessages([{ id: 1, text: "Hello! I'm your Moxie AI assistant.", sender: 'bot' }])}>
              <Trash2 size={18} />
            </button>
            <button style={{ background: 'transparent', border: 'none', color: theme.textMain, cursor: 'pointer' }} onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        <div style={styles.messagesArea} ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className="msg-animate" style={msg.sender === 'user' ? styles.userBubble : styles.botBubble}>
              {msg.file && <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '8px', marginBottom: '8px' }}><FileText size={20} /><span>{msg.file.name}</span></div>}
              {msg.sender === 'bot' ? (
                <div>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({inline, className, children}) {
                    return !inline ? <CodeBlock language={/language-(\w+)/.exec(className || '')?.[1]} isDarkMode={isDarkMode}>{children}</CodeBlock> : <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>{children}</code>
                  }}}>{msg.text}</ReactMarkdown>
                  <button style={{ background: 'transparent', border: 'none', color: theme.textSub, cursor: 'pointer', marginTop: '8px' }} onClick={() => speak(msg.text)}>
                    <Volume2 size={16} />
                  </button>
                </div>
              ) : <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>}
            </div>
          ))}
          {isLoading && <div style={{ ...styles.botBubble, width: '40px', textAlign: 'center' }}>...</div>}
        </div>

        <form onSubmit={handleSend} style={styles.inputForm}>
          {attachedFile && (
            <div style={{ paddingBottom: '10px', display: 'flex', gap: '8px' }}>
              <div style={{ background: theme.userBubbleBg, color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> {attachedFile.name} 
                <X size={14} style={{ cursor: 'pointer' }} onClick={() => setAttachedFile(null)} />
              </div>
            </div>
          )}
          <div style={styles.inputWrapper}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => setAttachedFile({ name: file.name, content: ev.target.result });
                reader.readAsText(file);
              }
            }} />
            <button type="button" style={{ background: 'transparent', border: 'none', color: theme.textSub, cursor: 'pointer', padding: '8px' }} onClick={() => fileInputRef.current.click()}><Paperclip size={20} /></button>
            <button 
              type="button" 
              className={isListening ? "mic-active" : ""} 
              style={{ background: 'transparent', border: 'none', color: isListening ? '#ef4444' : theme.textSub, cursor: 'pointer', padding: '8px', borderRadius: '50%' }} 
              onClick={startListening}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} style={styles.textInput} placeholder={isListening ? "Listening..." : "Type a message..."} />
            <button type="submit" style={{ background: '#4f46e5', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} disabled={isLoading}><Send size={18} /></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotUI;
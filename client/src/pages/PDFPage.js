import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, X, Sparkles, Copy, Check,
  Volume2, VolumeX, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ACTIONS = [
  { id: 'summarize', label: 'Summarize', desc: 'Get a short summary of the entire document' },
  { id: 'explain', label: 'Explain Simply', desc: 'Explain in simple easy-to-understand language' },
  { id: 'keypoints', label: 'Key Points', desc: 'Extract the most important bullet points' },
  { id: 'questions', label: 'Generate Questions', desc: 'Generate questions based on the content' },
  { id: 'custom', label: 'Ask Anything', desc: 'Ask your own custom question about the PDF' },
];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);

        // Load PDF.js from CDN
        if (!window.pdfjsLib) {
          await new Promise((res, rej) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = res;
            script.onerror = rej;
            document.head.appendChild(script);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 50); // max 50 pages

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          fullText += `\n--- Page ${i} ---\n${pageText}`;
        }

        resolve({ text: fullText.trim(), pages: pdf.numPages });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function askGroq(systemPrompt, userMessage) {
  const apiKey = process.env.REACT_APP_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set in client .env file');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 2000,
      temperature: 0.5,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function buildPrompt(action, customQuestion, pdfText, fileName) {
  const truncated = pdfText.length > 12000
    ? pdfText.substring(0, 12000) + '\n\n[Document truncated due to length...]'
    : pdfText;

  const systemPrompt = `You are an expert document analyst. You help users understand PDF documents clearly and accurately. Format your response with proper markdown — use headers, bullet points, and bold text where appropriate.`;

  const prompts = {
    summarize: `Please provide a comprehensive summary of this document titled "${fileName}". Cover the main topics, key findings, and conclusions.\n\nDocument content:\n${truncated}`,
    explain: `Please explain the content of this document titled "${fileName}" in simple, easy-to-understand language. Avoid jargon and make it accessible to someone with no background in this topic.\n\nDocument content:\n${truncated}`,
    keypoints: `Extract and list the most important key points from this document titled "${fileName}". Present them as clear bullet points organized by topic.\n\nDocument content:\n${truncated}`,
    questions: `Based on this document titled "${fileName}", generate 10 thoughtful questions that test understanding of the key concepts. Include both simple and complex questions.\n\nDocument content:\n${truncated}`,
    custom: `Answer this question about the document titled "${fileName}": ${customQuestion}\n\nDocument content:\n${truncated}`,
  };

  return { systemPrompt, userMessage: prompts[action] };
}

export default function PDFPage() {
  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [pages, setPages] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [action, setAction] = useState('summarize');
  const [customQuestion, setCustomQuestion] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB');
      return;
    }

    setFile(selectedFile);
    setResult('');
    setPdfText('');
    setExtracting(true);

    try {
      toast.success('Reading PDF...');
      const { text, pages: numPages } = await extractTextFromPDF(selectedFile);

      if (!text || text.trim().length < 50) {
        toast.error('Could not extract text. This PDF may be scanned/image-based.');
        setExtracting(false);
        return;
      }

      setPdfText(text);
      setPages(numPages);
      toast.success(`PDF loaded — ${numPages} pages, ${text.length.toLocaleString()} characters`);
    } catch (err) {
      toast.error('Failed to read PDF: ' + err.message);
      setFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleAnalyze = async () => {
    if (!pdfText) {
      toast.error('Please upload a PDF first');
      return;
    }
    if (action === 'custom' && !customQuestion.trim()) {
      toast.error('Please enter your question');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const { systemPrompt, userMessage } = buildPrompt(
        action, customQuestion, pdfText, file.name
      );
      const answer = await askGroq(systemPrompt, userMessage);
      setResult(answer);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error('Error: ' + err.message);
      if (err.message.includes('GROQ_API_KEY')) {
        setResult('❌ **Setup required:** Add your Groq API key to `client/.env` file:\n\n```\nREACT_APP_GROQ_API_KEY=your-groq-key-here\n```\n\nGet your free key at https://console.groq.com/keys');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  const handleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(result.replace(/[#*`]/g, ''));
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const removeFile = () => {
    setFile(null);
    setPdfText('');
    setResult('');
    setPages(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const card = {
    background: 'var(--nexus-surface)',
    border: '1px solid var(--nexus-border)',
    borderRadius: 20,
    padding: '20px 22px',
    marginBottom: 20,
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText style={{ width: 22, height: 22, color: '#f87171' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nexus-text)', margin: 0 }}>
            PDF Analyzer
          </h1>
          <p style={{ fontSize: 13, color: 'var(--nexus-muted)', margin: 0 }}>
            Upload any PDF — summarize, explain, extract key points, or ask questions
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!file && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={card}
        >
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? '#f87171' : 'var(--nexus-border)'}`,
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: dragOver ? 'rgba(239,68,68,0.05)' : 'transparent',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Upload style={{ width: 26, height: 26, color: '#f87171' }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--nexus-text)', margin: '0 0 6px' }}>
              Drop your PDF here or click to browse
            </p>
            <p style={{ fontSize: 13, color: 'var(--nexus-muted)', margin: '0 0 16px' }}>
              Supports PDF files up to 20MB · up to 50 pages
            </p>
            <div style={{
              display: 'inline-block',
              padding: '8px 20px',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              fontSize: 13,
              fontWeight: 500,
            }}>
              Choose PDF File
            </div>
          </div>
        </motion.div>
      )}

      {/* File loaded */}
      {file && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}
        >
          {extracting ? (
            <>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: '2px solid rgba(239,68,68,0.3)',
                  borderTopColor: '#f87171',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--nexus-text)', margin: 0 }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--nexus-muted)', margin: '2px 0 0' }}>
                  Reading PDF... please wait
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FileText style={{ width: 22, height: 22, color: '#f87171' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--nexus-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--nexus-muted)', margin: '2px 0 0' }}>
                  {formatBytes(file.size)} · {pages} pages · {pdfText.length.toLocaleString()} characters extracted
                </p>
              </div>
              <button
                onClick={removeFile}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X style={{ width: 15, height: 15, color: 'var(--nexus-muted)' }} />
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* Actions panel — only show when PDF is loaded */}
      {pdfText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={card}
        >
          {/* Action selector */}
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nexus-muted)', marginBottom: 10 }}>
            What do you want to do?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
            {ACTIONS.map(a => (
              <button
                key={a.id}
                onClick={() => setAction(a.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  background: action === a.id ? 'rgba(239,68,68,0.1)' : 'var(--nexus-bg)',
                  borderColor: action === a.id ? 'rgba(239,68,68,0.4)' : 'var(--nexus-border)',
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', color: action === a.id ? '#f87171' : 'var(--nexus-text)' }}>
                  {a.label}
                </p>
                <p style={{ fontSize: 11, margin: 0, color: 'var(--nexus-muted)', lineHeight: 1.4 }}>
                  {a.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Custom question input */}
          {action === 'custom' && (
            <div style={{ marginBottom: 16 }}>
              <textarea
                value={customQuestion}
                onChange={e => setCustomQuestion(e.target.value)}
                placeholder="e.g. What are the main conclusions? What does the author recommend? Explain chapter 3..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--nexus-border)',
                  background: 'var(--nexus-bg)',
                  color: 'var(--nexus-text)',
                  fontSize: 14,
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 28px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              boxShadow: '0 4px 20px rgba(239,68,68,0.25)',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles style={{ width: 16, height: 16 }} />
                {ACTIONS.find(a => a.id === action)?.label || 'Analyze'}
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={card}
        >
          {/* Result header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--nexus-text)', margin: 0 }}>
              ✨ {ACTIONS.find(a => a.id === action)?.label} Result
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleCopy} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid var(--nexus-border)',
                background: 'var(--nexus-bg)',
                color: 'var(--nexus-muted)',
                fontSize: 12, cursor: 'pointer',
              }}>
                {copied
                  ? <><Check style={{ width: 13, height: 13, color: '#4ade80' }} /> Copied</>
                  : <><Copy style={{ width: 13, height: 13 }} /> Copy</>
                }
              </button>
              <button onClick={handleSpeak} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid var(--nexus-border)',
                background: speaking ? 'rgba(239,68,68,0.1)' : 'var(--nexus-bg)',
                color: speaking ? '#f87171' : 'var(--nexus-muted)',
                fontSize: 12, cursor: 'pointer',
              }}>
                {speaking
                  ? <><VolumeX style={{ width: 13, height: 13 }} /> Stop</>
                  : <><Volume2 style={{ width: 13, height: 13 }} /> Listen</>
                }
              </button>
            </div>
          </div>

          {/* Result text rendered as markdown-like */}
          <div style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--nexus-text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {result.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px', color: 'var(--nexus-text)' }}>{line.slice(2)}</h2>;
              if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 16, fontWeight: 600, margin: '14px 0 6px', color: 'var(--nexus-text)' }}>{line.slice(3)}</h3>;
              if (line.startsWith('### ')) return <h4 key={i} style={{ fontSize: 14, fontWeight: 600, margin: '12px 0 4px', color: 'var(--nexus-text)' }}>{line.slice(4)}</h4>;
              if (line.startsWith('- ') || line.startsWith('• ')) return (
                <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0' }}>
                  <span style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }}>•</span>
                  <span>{line.slice(2)}</span>
                </div>
              );
              if (line.match(/^\d+\. /)) return <div key={i} style={{ margin: '4px 0', paddingLeft: 4 }}>{line}</div>;
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 600, margin: '6px 0' }}>{line.slice(2, -2)}</p>;
              if (line === '') return <div key={i} style={{ height: 8 }} />;
              return <p key={i} style={{ margin: '4px 0' }}>{line}</p>;
            })}
          </div>

          {/* Ask another question after result */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--nexus-border)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--nexus-muted)', marginBottom: 10 }}>
              Ask a follow-up question about this PDF:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. Can you explain point 3 in more detail?"
                value={action === 'custom' ? customQuestion : ''}
                onChange={e => { setAction('custom'); setCustomQuestion(e.target.value); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAnalyze(); }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--nexus-border)',
                  background: 'var(--nexus-bg)',
                  color: 'var(--nexus-text)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#fff',
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Ask
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
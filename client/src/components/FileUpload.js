import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUpload({ onFileReady }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const processFile = async (file) => {
    const id = Date.now().toString();
    const fileEntry = { id, name: file.name, size: file.size, status: 'uploading', fileId: null };
    setFiles(prev => [...prev, fileEntry]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Poll for processing status
      const fileId = data.file._id;
      let attempts = 0;

      const poll = async () => {
        attempts++;
        const { data: statusData } = await api.get(`/files/${fileId}/status`);
        if (statusData.file.status === 'ready') {
          setFiles(prev => prev.map(f =>
            f.id === id ? { ...f, status: 'ready', fileId } : f
          ));
          onFileReady?.({ fileId, fileName: file.name });
          toast.success(`${file.name} ready to query`);
        } else if (statusData.file.status === 'error') {
          setFiles(prev => prev.map(f =>
            f.id === id ? { ...f, status: 'error', error: statusData.file.errorMessage } : f
          ));
        } else if (attempts < 20) {
          setTimeout(poll, 1500);
        }
      };

      setTimeout(poll, 1000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed';
      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, status: 'error', error: msg } : f
      ));
      toast.error(msg);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    dropped.forEach(processFile);
  };

  const handleFileChange = (e) => {
    Array.from(e.target.files).forEach(processFile);
    e.target.value = '';
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all
          ${dragOver ? 'border-nexus-500 bg-nexus-500/5' : 'hover:border-nexus-500/50 hover:bg-white/3'}`}
        style={{ borderColor: dragOver ? undefined : 'var(--nexus-border)' }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Upload className="w-8 h-8 mx-auto mb-3 text-nexus-400" />
        <p className="text-sm font-medium" style={{ color: 'var(--nexus-text)' }}>
          Drop files here or click to upload
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--nexus-muted)' }}>
          PDF, DOCX, TXT, MD — up to 10MB each
        </p>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.map(file => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(77,123,255,0.1)' }}>
              <File className="w-4 h-4 text-nexus-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--nexus-text)' }}>
                {file.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--nexus-muted)' }}>
                {formatBytes(file.size)} · {
                  file.status === 'uploading' ? 'Uploading...' :
                  file.status === 'processing' ? 'Processing...' :
                  file.status === 'ready' ? 'Ready' :
                  file.error || 'Error'
                }
              </p>
            </div>
            <div className="flex-shrink-0">
              {file.status === 'uploading' || file.status === 'processing' ? (
                <Loader className="w-4 h-4 text-nexus-400 animate-spin" />
              ) : file.status === 'ready' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : file.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : null}
            </div>
            <button onClick={() => removeFile(file.id)}
              className="p-1 rounded-md hover:bg-white/10 transition-all flex-shrink-0"
              style={{ color: 'var(--nexus-muted)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

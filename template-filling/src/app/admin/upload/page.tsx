'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, File, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name || file.name);

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      router.push(`/admin/templates/${data.id}/mark`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '2rem', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to Library
      </Link>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
      >
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Upload <span className="gradient-text">Template</span></h1>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Template Name</label>
            <input 
              type="text" 
              placeholder="e.g. Service Agreement" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div 
            style={{ 
              border: '2px dashed var(--card-border)', 
              borderRadius: 'var(--radius)', 
              padding: '3rem', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
              background: file ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
              borderColor: file ? 'var(--success)' : 'var(--card-border)'
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {file ? (
              <>
                <CheckCircle size={40} color="var(--success)" />
                <div>
                  <div style={{ fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </>
            ) : (
              <>
                <Upload size={40} color="var(--muted)" />
                <div>
                  <div style={{ fontWeight: 600 }}>Click to upload or drag & drop</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>PDF, JPG, PNG (Max 10MB)</div>
                </div>
              </>
            )}
            <input 
              id="file-input"
              type="file" 
              accept=".pdf,image/*" 
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--accent)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            className="primary" 
            disabled={!file || loading}
            style={{ padding: '14px', fontSize: '1rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Loader2 size={18} className="animate-spin" /> Uploading...
              </span>
            ) : 'Upload and Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

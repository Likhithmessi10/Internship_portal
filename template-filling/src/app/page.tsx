'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Edit3, Type, ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTemplates(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Template <span className="gradient-text">Library</span></h1>
          <p style={{ color: 'var(--muted)' }}>Manage your documents and automation workflows.</p>
        </div>
        <Link href="/admin/upload">
          <button className="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Upload Template
          </button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <FileText size={48} color="var(--muted)" />
          <h3>No templates yet</h3>
          <p style={{ color: 'var(--muted)' }}>Upload your first PDF or image to get started.</p>
          <Link href="/admin/upload">
            <button className="secondary">Get Started</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {templates.map((template, i) => (
            <motion.div 
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '10px' }}>
                  <FileText size={20} color="var(--primary)" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{template.name}</h3>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {template.fields?.length || 0} fields marked
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <Link href={`/admin/templates/${template.id}/mark`} style={{ flex: 1 }}>
                  <button className="secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}>
                    <Edit3 size={14} style={{ marginRight: '5px' }} /> Mark
                  </button>
                </Link>
                <Link href={`/admin/templates/${template.id}/fill`} style={{ flex: 1 }}>
                  <button className="primary" style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}>
                    <Type size={14} style={{ marginRight: '5px' }} /> Fill
                  </button>
                </Link>
                <button 
                  className="secondary" 
                  style={{ width: '40px', padding: '8px', color: 'var(--accent)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                  onClick={async (e) => {
                    if (confirm('Delete this template?')) {
                      await fetch(`/api/templates/${template.id}`, { method: 'DELETE' });
                      setTemplates(templates.filter(t => t.id !== template.id));
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              

            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

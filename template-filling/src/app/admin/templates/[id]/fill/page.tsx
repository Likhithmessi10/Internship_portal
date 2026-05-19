'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Loader2, Check, ArrowLeft, Image as ImageIcon, Upload, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function FillPage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [templateId, setTemplateId] = useState('');

  useEffect(() => {
    async function init() {
      const { id } = await params;
      setTemplateId(id);
      const res = await fetch(`/api/templates/${id}`);
      const t = await res.json();
      setTemplate(t);
      
      // Initialize form data
      const initial: any = {};
      t?.fields?.forEach((f: any) => initial[f.label] = '');
      setFormData(initial);
      setLoading(false);
    }
    init();
  }, []);

  const handleImageUpload = (fieldLabel: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, [fieldLabel]: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/fill', {
        method: 'POST',
        body: JSON.stringify({ templateId, data: formData }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filled-${template.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error exporting file');
    }
    setExporting(false);
  };

  const handlePrint = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/fill', {
        method: 'POST',
        body: JSON.stringify({ templateId, data: formData }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      alert('Error printing file');
    }
    setExporting(false);
  };

  if (loading) return <div className="container">Loading form...</div>;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '2rem', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to Library
      </Link>
      
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Fill <span className="gradient-text">Form</span></h1>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Complete the fields to generate your document.</p>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {template?.fields?.map((field: any) => (
              <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  {field.type === 'image' ? <ImageIcon size={14} /> : null}
                  {field.label.toUpperCase().replace(/_/g, ' ')}
                  {(field.type === 'image' && field.widthPt && field.heightPt) && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.8 }}>
                      {Math.round(field.widthPt * 2)}x{Math.round(field.heightPt * 2)}px
                    </span>
                  )}
                </label>
                
                {field.type === 'image' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="Image URL..."
                        value={formData[field.label] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <label className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--secondary)', fontSize: '0.9rem' }}>
                        <Upload size={16} /> Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(field.label, e.target.files[0])}
                        />
                      </label>
                    </div>
                    {formData[field.label]?.startsWith('data:image') && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Check size={12} /> Image uploaded successfully
                      </div>
                    )}
                  </div>
                ) : (
                  <input 
                    type="text" 
                    placeholder={`Enter ${field.label}...`}
                    value={formData[field.label] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                className="primary" 
                onClick={handleExport}
                disabled={exporting}
                style={{ flex: 2, padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {exporting ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing...</>
                ) : (
                  <><Download size={18} /> Export PDF</>
                )}
              </button>
              <button 
                type="button" 
                className="secondary" 
                onClick={handlePrint}
                disabled={exporting}
                style={{ flex: 1, padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Printer size={18} /> Print
              </button>
            </div>
          </form>
        </div>

        <div style={{ width: '300px' }}>
          <div className="card glass" style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Template Details</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <FileText size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.9rem' }}>{template?.name}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Total Fields: {template?.fields?.length}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

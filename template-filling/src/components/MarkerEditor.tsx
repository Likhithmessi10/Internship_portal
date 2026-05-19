'use client';

import { useState, useRef, useEffect } from 'react';
import { Save, Plus, Trash2, ChevronLeft, ChevronRight, ArrowLeft, Eye, EyeOff, Image as ImageIcon, Type as TextIcon, CheckCircle, Bold, Italic, Underline } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Stage, Layer, Rect, Transformer, Text, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import * as pdfjs from 'pdfjs-dist';
import Link from 'next/link';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Field {
  id: string;
  label: string;
  x: number;
  y: number;
  xPt?: number | null;
  yPt?: number | null;
  width: number;
  height: number;
  widthPt?: number | null;
  heightPt?: number | null;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  pageIndex: number;
  type: string;
}

interface Template {
  id: string;
  name: string;
}

const PREVIEW_SCALE = 1.5;

export default function MarkerEditor({ templateId }: { templateId: string }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const [currentScale, setCurrentScale] = useState(PREVIEW_SCALE);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        // Load template metadata
        const templateRes = await fetch(`/api/templates/${templateId}`);
        if (!templateRes.ok) throw new Error('Failed to load template metadata');
        const templateData = await templateRes.json();
        setTemplate(templateData);
        
        // Load fields
        const fieldsRes = await fetch(`/api/templates/${templateId}/fields`);
        if (!fieldsRes.ok) throw new Error('Failed to load fields');
        const fieldsData = await fieldsRes.json();
        if (Array.isArray(fieldsData)) {
          setFields(fieldsData);
        }

        // Load PDF
        const pdfRes = await fetch(`/api/templates/${templateId}/file`);
        if (!pdfRes.ok) throw new Error('Failed to load PDF file');
        const pdfData = await pdfRes.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [templateId]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, pageIndex);
    }
  }, [pdfDoc, pageIndex]);

  const renderPage = async (pdf: any, index: number) => {
    const page = await pdf.getPage(index + 1);
    
    // Calculate dynamic scale to fit workspace
    const unscaledViewport = page.getViewport({ scale: 1 });
    const workspaceWidth = (workspaceRef.current?.clientWidth || 800) - 80; // 40px padding each side
    const fitScale = Math.min(2, workspaceWidth / unscaledViewport.width);
    setCurrentScale(fitScale);

    const viewport = page.getViewport({ scale: fitScale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    setPageImage(canvas.toDataURL());
    
    const newCanvasSize = { width: viewport.width, height: viewport.height };
    setCanvasSize(newCanvasSize);
  };

  // Handle de-normalization when fields and canvas are ready
  useEffect(() => {
    if (!isInitialized && fields.length > 0 && canvasSize.width > 0) {
      console.log('De-normalizing fields for canvas:', canvasSize);
      setFields(prevFields => prevFields.map(f => {
        // Prioritize Absolute Point mapping (xPt, yPt)
        if (f.xPt !== undefined && f.xPt !== null) {
          return {
            ...f,
            x: (f.xPt ?? 0) * currentScale,
            y: (f.yPt ?? 0) * currentScale,
            width: (f.widthPt || 100) * currentScale,
            height: (f.heightPt || 30) * currentScale,
          };
        }
        // Fallback to normalized percentages
        if (f.x <= 1 && f.width <= 1) {
          return {
            ...f,
            x: (f.x || 0) * canvasSize.width,
            y: (f.y || 0) * canvasSize.height,
            width: (f.width || 0) * canvasSize.width,
            height: (f.height || 0) * canvasSize.height,
            xPt: ((f.x || 0) * canvasSize.width) / currentScale,
            yPt: ((f.y || 0) * canvasSize.height) / currentScale,
            widthPt: ((f.width || 0) * canvasSize.width) / currentScale,
            heightPt: ((f.height || 0) * canvasSize.height) / currentScale,
          };
        }
        return f;
      }));
      setIsInitialized(true);
    }
  }, [fields, canvasSize, isInitialized, currentScale]);

  const handleAddRect = () => {
    const newField: Field = {
      id: Math.random().toString(36).substr(2, 9),
      label: `field_${fields.length + 1}`,
      x: 50,
      y: 50,
      width: 100,
      height: 30,
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
      pageIndex: pageIndex,
      type: 'text'
    };
    setFields([...fields, newField]);
    setSelectedId(newField.id);
  };

  const handleSave = async () => {
    setSaving(true);
    const normalizedFields = fields.map(f => ({
      ...f,
      x: f.x / canvasSize.width,
      y: f.y / canvasSize.height,
      width: f.width / canvasSize.width,
      height: f.height / canvasSize.height,
      widthPt: f.width / currentScale,
      heightPt: f.height / currentScale,
      xPt: f.x / currentScale,
      yPt: f.y / currentScale,
    }));

    const res = await fetch(`/api/templates/${templateId}/fields`, {
      method: 'POST',
      body: JSON.stringify({ fields: normalizedFields }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(`Failed to save template: ${errorData.error}`);
    } else {
      setShowSuccessModal(true);
    }
    setSaving(false);
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Loading editor...</div>;
  if (error) return (
    <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
      <div className="card" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        <h2>Error Loading Template</h2>
        <p>{error}</p>
        <button className="primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="glass" style={{ width: '350px', padding: '1.5rem', borderRight: '1px solid var(--card-border)', overflowY: 'auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Library
        </Link>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{template?.name}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Map fields to PDF coordinates</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Fields</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="secondary" 
              onClick={handleSave} 
              disabled={saving}
              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Save Template"
            >
              <Save size={14} />
            </button>
            <button className="primary" onClick={handleAddRect} style={{ padding: '8px 12px' }}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fields.map(field => (
            <div 
              key={field.id} 
              className="card" 
              style={{ 
                padding: '12px', 
                borderColor: selectedId === field.id ? 'var(--primary)' : 'var(--card-border)',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedId(field.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <input 
                  value={field.label}
                  onChange={(e) => setFields(fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))}
                  style={{ background: 'transparent', border: 'none', padding: 0, fontWeight: 600, width: '150px' }}
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                  style={{ padding: '4px', background: 'transparent', color: 'var(--muted)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
               <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', gap: '8px 12px' }}>
                {/* Coordinates removed as requested */}
              </div>
              
              {field.type === 'image' && (
                <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  Target: {Math.round((field.width / PREVIEW_SCALE) * 2)} x {Math.round((field.height / PREVIEW_SCALE) * 2)} px (for 144 DPI)
                </div>
              )}
              
              {selectedId === field.id && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Field Type</label>
                  <select 
                    value={field.type || 'text'}
                    onChange={(e) => setFields(fields.map(f => f.id === field.id ? { ...f, type: e.target.value } : f))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem' }}
                  >
                    <option value="text">Text Field</option>
                    <option value="image">Image Field</option>
                  </select>
                </div>
              )}

              {selectedId === field.id && field.type === 'image' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Width (pt)</label>
                    <input 
                      type="number" 
                      value={Math.round((field.width || 0) / PREVIEW_SCALE)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setFields(fields.map(f => f.id === field.id ? { ...f, width: val * PREVIEW_SCALE } : f));
                      }}
                      style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Height (pt)</label>
                    <input 
                      type="number" 
                      value={Math.round((field.height || 0) / PREVIEW_SCALE)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setFields(fields.map(f => f.id === field.id ? { ...f, height: val * PREVIEW_SCALE } : f));
                      }}
                      style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              )}


              
              {selectedId === field.id && field.type !== 'image' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Size</label>
                    <input 
                      type="number" 
                      value={field.fontSize}
                      onChange={(e) => setFields(fields.map(f => f.id === field.id ? { ...f, fontSize: parseInt(e.target.value) } : f))}
                      style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Font</label>
                    <select 
                      value={field.fontFamily}
                      onChange={(e) => setFields(fields.map(f => f.id === field.id ? { ...f, fontFamily: e.target.value } : f))}
                      style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}
                    >
                      <option value="Helvetica">Helvetica</option>
                      <option value="Arial">Arial</option>
                      <option value="Times-Roman">Times</option>
                      <option value="Courier">Courier</option>
                      <option value="Brittany Signature">Brittany Signature</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedId === field.id && field.type !== 'image' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
                  <button 
                    className={field.bold ? "primary" : "secondary"}
                    onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, bold: !f.bold } : f))}
                    style={{ padding: '6px', flex: 1, display: 'flex', justifyContent: 'center' }}
                    title="Bold"
                  >
                    <Bold size={14} />
                  </button>
                  <button 
                    className={field.italic ? "primary" : "secondary"}
                    onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, italic: !f.italic } : f))}
                    style={{ padding: '6px', flex: 1, display: 'flex', justifyContent: 'center' }}
                    title="Italic"
                  >
                    <Italic size={14} />
                  </button>
                  <button 
                    className={field.underline ? "primary" : "secondary"}
                    onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, underline: !f.underline } : f))}
                    style={{ padding: '6px', flex: 1, display: 'flex', justifyContent: 'center' }}
                    title="Underline"
                  >
                    <Underline size={14} />
                  </button>
                </div>
              )}
              
              {selectedId === field.id && field.type !== 'image' && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Color</label>
                  <input 
                    type="color" 
                    value={field.color || '#000000'}
                    onChange={(e) => setFields(fields.map(f => f.id === field.id ? { ...f, color: e.target.value } : f))}
                    style={{ width: '100%', height: '30px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          className="primary" 
          onClick={handleSave} 
          disabled={saving}
          style={{ width: '100%', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {saving ? 'Saving...' : <><Save size={18} /> Save Template</>}
        </button>
      </div>

      {/* Editor Workspace */}
      <div ref={workspaceRef} style={{ flex: 1, background: 'var(--input)', overflow: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="secondary" onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.9rem' }}>Page {pageIndex + 1} of {numPages}</span>
          <button className="secondary" onClick={() => setPageIndex(Math.min(numPages - 1, pageIndex + 1))} disabled={pageIndex === numPages - 1}>
            <ChevronRight size={18} />
          </button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className="secondary" 
              onClick={() => setShowPreview(!showPreview)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {showPreview ? <><EyeOff size={14} /> Hide Sample</> : <><Eye size={14} /> Show Sample</>}
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', boxShadow: '0 0 40px rgba(0,0,0,0.1)' }}>
          {pageImage && (
            <Stage
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null);
                }
              }}
              style={{ background: 'white' }}
            >
              <Layer>
                {pageImage && (
                  <KonvaImage 
                    image={new (window as any).Image()}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    ref={(node: any) => {
                      if (node && pageImage) {
                        const img = new (window as any).Image();
                        img.src = pageImage;
                        img.onload = () => {
                          node.image(img);
                          node.getLayer().batchDraw();
                        };
                      }
                    }}
                  />
                )}
                {fields.filter(f => f.pageIndex === pageIndex).map((field) => (
                  <Rectangle
                    key={field.id}
                    shapeProps={field}
                    isSelected={field.id === selectedId}
                    showPreview={showPreview}
                    previewScale={currentScale}
                    onSelect={() => setSelectedId(field.id)}
                    onChange={(newAttrs: any) => {
                      setFields(fields.map(f => f.id === field.id ? { ...f, ...newAttrs } : f));
                    }}
                  />
                ))}
              </Layer>
            </Stage>
          )}
        </div>
      </div>

      {/* Custom Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{
            width: '400px',
            textAlign: 'center',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            background: 'var(--background)',
            border: '1px solid var(--card-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)'
            }}>
              <CheckCircle size={48} />
            </div>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Success!</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Template saved and synchronized successfully.</p>
            </div>
            <button 
              className="primary" 
              style={{ width: '100%', padding: '12px' }}
              onClick={() => router.push('/')}
            >
              OK, Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Rectangle({ shapeProps, isSelected, showPreview, previewScale, onSelect, onChange }: any) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  // Use a data URI for placeholder to avoid external connection issues
  const placeholderImg = `data:image/svg+xml;base64,${btoa('<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" fill="#2d2d30"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#6366f1" text-anchor="middle" dy=".3em">Image Field</text></svg>')}`;
  const [image] = useImage(placeholderImg);

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group
        draggable
        x={shapeProps.x}
        y={shapeProps.y}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onClick={onSelect}
        onTap={onSelect}
      >
        <Rect
          ref={shapeRef}
          width={shapeProps.width}
          height={shapeProps.height}
          fill="rgba(99, 102, 241, 0.1)"
          strokeWidth={isSelected ? 2 : 1}
        />
        {shapeProps.type === 'image' && (
          <Text
            text={`${Math.round((shapeProps.width / previewScale) * 2)}x${Math.round((shapeProps.height / previewScale) * 2)}px`}
            fontSize={10}
            fill={isSelected ? "#6366f1" : "rgba(99, 102, 241, 0.6)"}
            y={-14}
            fontStyle="bold"
          />
        )}
        {showPreview && (
          <Text
            text={shapeProps.label}
            width={shapeProps.width || 0}
            height={shapeProps.height || 0}
            fontSize={(shapeProps.fontSize || 12) * previewScale}
            fontFamily={shapeProps.fontFamily === 'Arial' ? 'Helvetica' : shapeProps.fontFamily}
            fontStyle={`${shapeProps.bold ? 'bold ' : ''}${shapeProps.italic ? 'italic' : ''}`.trim() || 'normal'}
            textDecoration={shapeProps.underline ? 'underline' : ''}
            fill={shapeProps.color || '#fff'}
            verticalAlign="middle"
            align="center"
            wrap="none"
            ellipsis={true}
          />
        )}
        {showPreview && shapeProps.type === 'image' && (
          <KonvaImage
            image={image}
            width={shapeProps.width}
            height={shapeProps.height}
            opacity={0.6}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
            });
          }}
        />
      )}
    </>
  );
}

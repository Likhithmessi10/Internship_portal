'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// Dynamically import the editor component with SSR disabled
// This prevents "DOMMatrix is not defined" error which happens when pdfjs/konva load on server
const MarkerEditor = dynamic(() => import('@/components/MarkerEditor'), { 
  ssr: false,
  loading: () => <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Initializing Editor...</div>
});

export default function MarkerPage() {
  const params = useParams();
  const id = params.id as string;

  if (!id) return null;

  return <MarkerEditor templateId={id} />;
}

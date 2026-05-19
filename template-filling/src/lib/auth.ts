import { NextRequest, NextResponse } from 'next/server';

export function requireSidecarToken(req: NextRequest): NextResponse | null {
  const expected = process.env.SIDECAR_TOKEN;
  if (!expected) {
    console.error('SIDECAR_TOKEN env var is not set — rejecting all API requests');
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 503 });
  }
  const provided = req.headers.get('x-sidecar-token');
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null; // token valid
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSidecarToken } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { fields } = await req.json();

    await prisma.field.deleteMany({ where: { templateId: id } });

    const createdFields = await prisma.field.createMany({
      data: fields.map((f: any) => ({
        label: f.label,
        type: f.type || 'text',
        x: parseFloat(f.x),
        y: parseFloat(f.y),
        xPt: parseFloat(f.xPt),
        yPt: parseFloat(f.yPt),
        width: parseFloat(f.width),
        height: parseFloat(f.height),
        widthPt: parseFloat(f.widthPt),
        heightPt: parseFloat(f.heightPt),
        fontSize: parseInt(f.fontSize) || 12,
        fontFamily: f.fontFamily || 'Helvetica',
        color: f.color || '#000000',
        bold: !!f.bold,
        italic: !!f.italic,
        underline: !!f.underline,
        pageIndex: parseInt(f.pageIndex) || 0,
        templateId: id,
      })),
    });

    return NextResponse.json(createdFields);
  } catch (error: any) {
    console.error('Field save error:', error);
    return NextResponse.json({ error: 'Failed to save fields' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fields = await prisma.field.findMany({ where: { templateId: id } });
    return NextResponse.json(fields);
  } catch (error: any) {
    console.error('Get fields error:', error);
    return NextResponse.json({ error: 'Failed to get fields' }, { status: 500 });
  }
}

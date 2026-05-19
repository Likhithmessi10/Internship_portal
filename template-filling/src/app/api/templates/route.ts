import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSidecarToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);
    // Strip original filename — use only UUID to avoid path traversal / double-extension tricks
    let fileName = `${uuidv4()}.pdf`;

    if (file.type.startsWith('image/')) {
      const pdfDoc = await PDFDocument.create();
      const image = file.type === 'image/jpeg'
        ? await pdfDoc.embedJpg(bytes)
        : await pdfDoc.embedPng(bytes);

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      const pdfBytes = await pdfDoc.save();
      buffer = Buffer.from(pdfBytes);
      // fileName already ends in .pdf
    }

    const uploadDir = join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // directory already exists
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const template = await prisma.template.create({
      data: {
        name: name || file.name,
        filePath: fileName,
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const templates = await prisma.template.findMany({
      include: { fields: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('List templates error:', error);
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 });
  }
}

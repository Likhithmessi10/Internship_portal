import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSidecarToken } from '@/lib/auth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  const authErr = requireSidecarToken(req);
  if (authErr) return authErr;

  try {
    const { templateId, data } = await req.json();

    if (!templateId || !data) {
      return NextResponse.json({ error: 'Missing templateId or data' }, { status: 400 });
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { fields: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const filePath = join(process.cwd(), 'uploads', template.filePath);
    const existingPdfBytes = await readFile(filePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const pages = pdfDoc.getPages();
    
    // Cache for embedded fonts
    const fontCache: any = {};
    const getFont = async (name: string, bold: boolean, italic: boolean) => {
      let baseName = name === 'Arial' ? 'Helvetica' : (name || 'Helvetica');
      let variant = baseName;
      
      if (baseName === 'Helvetica') {
        if (bold && italic) variant = 'HelveticaBoldOblique';
        else if (bold) variant = 'HelveticaBold';
        else if (italic) variant = 'HelveticaOblique';
      } else if (baseName === 'Times-Roman') {
        if (bold && italic) variant = 'TimesBoldItalic';
        else if (bold) variant = 'TimesBold';
        else if (italic) variant = 'TimesItalic';
        else variant = 'TimesRoman';
      } else if (baseName === 'Courier') {
        if (bold && italic) variant = 'CourierBoldOblique';
        else if (bold) variant = 'CourierBold';
        else if (italic) variant = 'CourierOblique';
      }

      if (baseName === 'Brittany Signature') {
        if (fontCache[baseName]) return fontCache[baseName];
        try {
          const fontPath = join(process.cwd(), 'public', 'fonts', 'BrittanySignature.ttf');
          const fontBytes = await readFile(fontPath);
          const font = await pdfDoc.embedFont(fontBytes);
          fontCache[baseName] = font;
          return font;
        } catch (e) {
          console.error('Failed to load custom font:', e);
          // Fallback to Helvetica
          baseName = 'Helvetica';
          variant = 'Helvetica';
        }
      }

      if (fontCache[variant]) return fontCache[variant];
      const font = await pdfDoc.embedFont((StandardFonts as any)[variant] || StandardFonts.Helvetica);
      fontCache[variant] = font;
      return font;
    };

    for (const field of template.fields) {
      const value = data[field.label];
      if (value !== undefined && value !== null) {
        const page = pages[field.pageIndex];
        if (!page) continue;

        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Use absolute points if available (for precision), fallback to percentage
        const fieldWidth = field.widthPt || (field.width * pageWidth);
        const fieldHeight = field.heightPt || (field.height * pageHeight);
        const x = field.xPt || (field.x * pageWidth);
        const y = pageHeight - (field.yPt || (field.y * pageHeight)) - fieldHeight;

        if (field.type === 'image') {
          try {
            let imageBytes: ArrayBuffer;
            let imageType: 'jpg' | 'png' = 'jpg';

            if (value.startsWith('data:image')) {
              // Handle base64/data URL
              const base64Data = value.split(',')[1];
              imageBytes = Buffer.from(base64Data, 'base64').buffer;
              imageType = value.includes('image/png') ? 'png' : 'jpg';
            } else {
              // Handle URL
              const imgRes = await fetch(value);
              imageBytes = await imgRes.arrayBuffer();
              imageType = value.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
            }

            const image = imageType === 'png' 
              ? await pdfDoc.embedPng(imageBytes) 
              : await pdfDoc.embedJpg(imageBytes);

            const { width: imgWidth, height: imgHeight } = image.scale(1);
            const fieldWidth = field.width * pageWidth;
            const fieldHeight = field.height * pageHeight;

            // Fit image in bounding box while maintaining aspect ratio
            const scale = Math.min(fieldWidth / imgWidth, fieldHeight / imgHeight);
            const drawWidth = imgWidth * scale;
            const drawHeight = imgHeight * scale;

            // Center in box
            const drawX = x + (fieldWidth - drawWidth) / 2;
            const drawY = y + (fieldHeight - drawHeight) / 2;

            page.drawImage(image, {
              x: drawX,
              y: drawY,
              width: drawWidth,
              height: drawHeight,
            });
          } catch (e) {
            console.error('Failed to embed image:', e);
          }
          continue;
        }

        const fontFamily = field.fontFamily;
        const font = await getFont(fontFamily, !!field.bold, !!field.italic);

        // Helper to convert hex to rgb
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
          return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
          } : { r: 0, g: 0, b: 0 };
        };

        const { r, g, b } = hexToRgb(field.color);

        const text = String(value || '');
        if (!text) continue;

        const fontSize = field.fontSize || 12;
        let finalSize = fontSize;
        
        let textWidth = font.widthOfTextAtSize(text, finalSize);
        if (textWidth > fieldWidth && textWidth > 0) {
          finalSize = (fieldWidth / textWidth) * finalSize;
          if (finalSize < 2) finalSize = 2;
          textWidth = font.widthOfTextAtSize(text, finalSize);
        }

        const centeredX = x + (fieldWidth - textWidth) / 2;

        const textHeight = font.heightAtSize(finalSize);
        const textY = y + (fieldHeight - textHeight) / 2;

        page.drawText(text, {
          x: centeredX,
          y: textY,
          size: finalSize,
          font: font,
          color: rgb(r, g, b),
        });

        if (field.underline) {
          page.drawLine({
            start: { x: centeredX, y: textY - 1 },
            end: { x: centeredX + textWidth, y: textY - 1 },
            thickness: 1,
            color: rgb(r, g, b),
          });
        }
      }
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="filled-${template.name}"`,
      },
    });
  } catch (error: any) {
    console.error('Fill error:', error);
    return NextResponse.json({ error: 'Failed to fill template' }, { status: 500 });
  }
}

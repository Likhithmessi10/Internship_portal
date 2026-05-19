# PDF & Image Template Filling System

A powerful and modern Next.js 16 full-stack application designed to manage document templates (PDFs or Images), design customizable fields over them dynamically using a visual canvas editor, and generate filled documents programmatically.

The project leverages **Prisma 7** with a PostgreSQL backend (utilizing modern Node-PostgreSQL TCP connection pooling driver adapters) and uses **pdf-lib** for pixel-precise field mapping and font styling (including signature fonts).

---

## Key Features
- **Template Management**: Upload PDF templates or images (JPG/PNG are automatically converted to PDF).
- **Interactive Canvas Editor**: Design and place input fields dynamically on template pages using Konva.js.
- **Advanced Field Styling**: Configure field typography (Helvetica, Times-Roman, Courier, custom signature fonts like *Brittany Signature*), size, color, alignments, bold, italic, and underline styling.
- **Dynamic Image Fields**: Map image fields (e.g. signature areas) to embed custom user images.
- **API-based Form Filling**: Programmatic JSON endpoints to populate templates and download fully compiled PDFs.
- **Prisma 7 Ready**: Uses centralized TypeScript configurations (`prisma.config.ts`) and database driver adapters (`@prisma/adapter-pg`).

---

## Getting Started

### Prerequisites
- Node.js (v18.x or later recommended)
- PostgreSQL database instance

### 1. Installation
Install all dependencies:
```bash
npm install
```

### 2. Database & Environment Configuration
Create a `.env` file in the root directory and add your PostgreSQL database connection URL:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?schema=public"
```

### 3. Initialize Database and Prisma Client
Prisma 7 decoupled database connection variables from the schema file into `prisma.config.ts`. Run the following command to sync your database schema models (`Template`, `Field`) and generate the Prisma Client:
```bash
# Push schema changes to your database
npx prisma db push

# Generate the Prisma Client
npx prisma generate
```

### 4. Running the Development Server
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to access the template designer dashboard.

---

## Directory Structure
```
├── prisma/
│   └── schema.prisma         # Database schema models (Template, Field)
├── src/
│   ├── app/
│   │   ├── api/              # Backend API routes (templates, fields, fill)
│   │   ├── admin/            # Frontend admin panels for template uploading & designing
│   │   └── layout.tsx        # Base application wrapper
│   ├── components/           # Canvas designer & layout components
│   └── lib/
│       └── prisma.ts         # Prisma client instantiation with PostgreSQL adapter
├── public/
│   └── fonts/                # Custom TTF fonts (e.g., BrittanySignature.ttf)
├── uploads/                  # Storage directory for uploaded PDF templates
├── prisma.config.ts          # Prisma 7 global configuration file
└── package.json
```

---

## API Documentation

### 1. Templates API

#### `GET /api/templates`
Fetch all available templates ordered by creation date.
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "caddf6d5-f067-4c91-b9cc-ab894eaabe68",
      "name": "NOC Template",
      "filePath": "7e7d1280-02c1-4630-bd4e-aa98a61fa349-NOC.pdf",
      "createdAt": "2026-05-08T05:49:24.531Z",
      "updatedAt": "2026-05-08T05:49:24.531Z",
      "fields": []
    }
  ]
  ```

#### `POST /api/templates`
Upload a new document template. Accepts multipart form data. If an image file is uploaded, it is automatically converted into a single-page PDF document.
- **Request Type**: `multipart/form-data`
- **Payload**:
  - `file`: The PDF or Image file (JPEG/PNG).
  - `name`: *Optional* template name (defaults to file name).
- **Response** (`200 OK`):
  ```json
  {
    "id": "caddf6d5-f067-4c91-b9cc-ab894eaabe68",
    "name": "NOC Template",
    "filePath": "7e7d1280-02c1-4630-bd4e-aa98a61fa349-NOC.pdf",
    "createdAt": "2026-05-08T05:49:24.531Z",
    "updatedAt": "2026-05-08T05:49:24.531Z"
  }
  ```

#### `GET /api/templates/[id]`
Retrieve a specific template with all its defined fields.
- **Response** (`200 OK`):
  ```json
  {
    "id": "caddf6d5-f067-4c91-b9cc-ab894eaabe68",
    "name": "NOC Template",
    "filePath": "7e7d1280-02c1-4630-bd4e-aa98a61fa349-NOC.pdf",
    "fields": [
      {
        "id": "3ffd9330-3b6d-43b8-ab2c-4f31cb90c276",
        "label": "Name",
        "type": "text",
        "x": 0.348,
        "y": 0.105,
        "xPt": 250.5,
        "yPt": 74.8,
        "width": 0.517,
        "height": 0.023,
        "fontSize": 12,
        "fontFamily": "Arial",
        "color": "#000000",
        "pageIndex": 0
      }
    ]
  }
  ```

#### `DELETE /api/templates/[id]`
Delete a template and cascadingly delete all mapped fields.
- **Response** (`200 OK`):
  ```json
  {
    "success": true
  }
  ```

---

### 2. Fields API

#### `GET /api/templates/[id]/fields`
Retrieve all fields mapped to a specific template.
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "3ffd9330-3b6d-43b8-ab2c-4f31cb90c276",
      "label": "Name",
      "type": "text",
      "x": 0.348,
      "y": 0.105,
      "fontSize": 12,
      "pageIndex": 0
    }
  ]
  ```

#### `POST /api/templates/[id]/fields`
Overwrites and saves field configurations for the template. This deletes existing fields and inserts the new list.
- **Request Type**: `application/json`
- **Payload**:
  ```json
  {
    "fields": [
      {
        "label": "Signature Area",
        "type": "image",
        "x": 0.12,
        "y": 0.48,
        "xPt": 100.0,
        "yPt": 350.0,
        "width": 0.16,
        "height": 0.03,
        "widthPt": 100,
        "heightPt": 30,
        "pageIndex": 0
      }
    ]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "count": 1
  }
  ```

---

### 3. File Asset Serving

#### `GET /api/templates/[id]/file`
Stream the raw uploaded template PDF file directly as `application/pdf` (useful for renderer canvases).
- **Headers**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename="<name>"`

---

### 4. Template Form Filler API

#### `POST /api/fill`
Populate a template with custom data and download the resulting PDF document.
- **Request Type**: `application/json`
- **Payload**:
  ```json
  {
    "templateId": "caddf6d5-f067-4c91-b9cc-ab894eaabe68",
    "data": {
      "Name": "John Doe",
      "Roll Number": "A0012345",
      "Year": "2026",
      "Signature Area": "data:image/png;base64,iVBORw0KGgoAAAANSU..."
    }
  }
  ```
  *Note: Values for image fields can be provided either as base64-encoded Data URLs or remote image URLs.*
- **Response** (`200 OK`):
  - Returns a binary stream (`Content-Type: application/pdf`) with `Content-Disposition: attachment; filename="filled-<template_name>"`.

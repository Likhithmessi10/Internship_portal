# Template Filling — Integration with the APTRANSCO Portal

This is the **sidecar** used by the main APTRANSCO portal to generate offer
letters (and any future templated documents). See the upstream project's
[README.md](./README.md) for the full template-designer feature list.

## Architecture

```
┌──────────────────┐         ┌──────────────────────┐
│ student clicks   │ ──HTTP─▶ │ Express backend       │
│ "Download Offer  │          │ (port 5001)           │
│  Letter"         │ ◀──PDF── │ studentController     │
└──────────────────┘          │   .getOfferLetter()   │
                              │ services/offer        │
                              │   LetterService.js    │
                              └──────────┬───────────┘
                                         │ POST /api/fill
                                         │ { templateId, data }
                                         ▼
                              ┌──────────────────────┐
                              │ template-filling      │
                              │ Next.js sidecar       │
                              │ (port 3100)           │
                              │                      │
                              │ pulls Template+Field │
                              │ rows from shared DB, │
                              │ overlays values onto │
                              │ uploaded PDF with    │
                              │ pdf-lib              │
                              └──────────────────────┘
```

Both processes share **one PostgreSQL database** (`aptransco`), in **two
Postgres schemas**:
- `public` — main portal tables
- `template_filling` — `Template` and `Field` tables (this sidecar)

## Running

In separate terminals:

```bash
# 1. Main backend (port 5001)
cd backend && npm run dev

# 2. Template-filling sidecar (port 3100)
cd template-filling && npm run dev
```

The sidecar's admin UI is at <http://localhost:3100/admin/templates> — PRTI
uses it to upload offer-letter PDFs and visually place named field markers.

## Configuring the active offer letter

1. In the sidecar UI, upload a blank offer-letter PDF
2. Open the template, click each placeholder area to add a field, and **name
   each field** using one of the labels listed below
3. In the main portal, sign in as **PRTI** → **System → Offer Letter Setup**
4. Click the template to make it active

After that, students hitting `GET /api/v1/students/applications/:id/offer-letter`
will get the filled PDF.

## Field label vocabulary

The main backend sends a flat label→value dictionary built from the student's
application. Use **these exact labels** when placing fields in the sidecar UI
(case-sensitive, including spaces):

| Label              | Source                                         |
|--------------------|------------------------------------------------|
| `Student Name`     | `student.fullName`                             |
| `Roll Number`      | `student.rollNumber`                           |
| `College`          | `student.collegeName`                          |
| `Branch`           | `student.branch`                               |
| `Year of Study`    | `student.yearOfStudy`                          |
| `CGPA`             | `student.cgpa`                                 |
| `Email`            | `student.user.email`                           |
| `Phone`            | `student.phone`                                |
| `Internship Title` | `internship.title`                             |
| `Department`       | `departmentGroup.department` or `internship.department` |
| `Field`            | `field.fieldName`                              |
| `Location`         | `application.preferredLocation`                |
| `Duration`         | `internship.duration`                          |
| `Internship Type`  | `internship.internshipType`                    |
| `Internship Mode`  | `internship.internshipMode`                    |
| `Assigned Role`    | `application.assignedRole`                     |
| `Stipend`          | "₹<amount>" or "Unpaid / Learning"             |
| `Stipend Amount`   | raw number                                     |
| `Mentor Name`      | `application.mentor.name`                      |
| `Mentor Email`     | `application.mentor.email`                     |
| `Issue Date`       | today, formatted                               |
| `Joining Date`     | `application.joiningDate`, formatted           |
| `End Date`         | `application.endDate`, formatted               |
| `Reference ID`     | first 8 chars of application id (uppercase)    |
| `Ref No`           | `APT/INT/OFFER/<refId>/<year>`                 |
| `Year`             | current year                                   |

Unmapped labels are silently ignored. Labels not on this list won't be
auto-filled (the value will be blank in the generated PDF). If you need new
labels, extend `backend/services/offerLetterService.js → buildOfferLetterFields()`.

## Environment

`template-filling/.env`:

```
DATABASE_URL="postgresql://postgres:2912@localhost:5433/aptransco?schema=template_filling"
PORT=3100
```

`backend/.env` (defaults shown):

```
# Where the sidecar is running
TEMPLATE_FILLING_URL=http://localhost:3100

# Optional, defaults to 30000
OFFER_LETTER_API_TIMEOUT_MS=30000
```

If `TEMPLATE_FILLING_URL` isn't set, the backend defaults to
`http://localhost:3100` — matches the dev setup above.

## Sync notes

This folder is a **vendored copy** of
<https://github.com/Likhithmessi10/template_filling>. To pull upstream changes
without touching `.env`:

```bash
# from repo root
git clone https://github.com/Likhithmessi10/template_filling.git _tmp_tf
# overwrite source files but keep our .env / .env.example / node_modules
rsync -a --exclude='.git' --exclude='.env*' --exclude='node_modules' \
      _tmp_tf/ template-filling/
rm -rf _tmp_tf
cd template-filling && npx prisma db push && npx prisma generate
```

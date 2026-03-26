// Use this file to run 'npx prisma db push' or 'npx prisma migrate dev'

datasource db {
  provider = "postgresql" // or "mysql" / "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// --- ENUMS ---

enum Role {
  Student
  PRTI
  HOD
  Mentor
}

enum Course {
  B_Tech   @map("B.Tech")
  B_Sc     @map("B.Sc")
  Diploma
}

enum Domain {
  CSE
  ECE
  EEE
  MECH
  CIVIL
}

enum InternshipType {
  MONETARY
  NON_MONETARY
}

enum ApplicationStatus {
  Pending
  Shortlisted
  Selected
  Rejected
}

enum ScoreCriteria {
  ACADEMIC_MERIT
  SOP_QUALITY
  DISCIPLINE_RELEVANCE
}

enum Decision {
  YES
  NO
}

// --- MODELS ---

model User {
  uid           String    @id // Alpha-numeric as per your schema
  role          Role
  name          String
  email         String    @unique
  phone_number  String
  password_hash String
  created_at    DateTime  @default(now())

  // Relationships
  student_profile  StudentDetails?
  mentor_profile   MentorDetails?
  uploaded_docs    Documents[]     @relation("Uploader")
}

model StudentDetails {
  uid            String    @id
  user           User      @relation(fields: [uid], references: [uid])
  
  profile_pic_id String?
  profile_pic    Documents? @relation("ProfilePic", fields: [profile_pic_id], references: [document_id])
  
  clg_roll_no    String
  course         Course
  domain         Domain
  aadhar_number  String    @unique
  dob            DateTime
  address        String
  institution_name String
  affiliation    String
  experience     String?   @db.Text
  projects       String?   @db.Text
  github_link    String?
  linkedin_link  String?

  applications   Applications[]
  stipend        Stipend?
  shortlist_entry Shortlist[]
}

model MentorDetails {
  uid         String   @id
  user        User     @relation(fields: [uid], references: [uid])
  designation String
  department  String

  assigned_applications Applications[]
}

model Documents {
  document_id String @id @default(uuid())
  url         String
  uploader_id String
  uploader    User   @relation("Uploader", fields: [uploader_id], references: [uid])

  // Back-references
  student_profiles StudentDetails[] @relation("ProfilePic")
  resumes         Applications[]    @relation("ResumeDoc")
  sops            Applications[]    @relation("SOPDoc")
  nocs            Applications[]    @relation("NOCDoc")
  memos           Applications[]    @relation("MemoDoc")
}

model Internships {
  internship_id      String         @id @default(uuid())
  department         String
  intake            Int
  type              InternshipType
  job_description    String         @db.Text
  open_from_date     DateTime
  closed_by_date     DateTime
  available_locations String
  is_active          Boolean        @default(true)

  applications       Applications[]
}

model Applications {
  application_id   String            @id @default(uuid())
  
  student_id       String
  student          StudentDetails    @relation(fields: [student_id], references: [uid])
  
  internship_id    String
  internship       Internships       @relation(fields: [internship_id], references: [internship_id])
  
  resume_id        String
  resume           Documents         @relation("ResumeDoc", fields: [resume_id], references: [document_id])
  
  sop_id           String
  sop              Documents         @relation("SOPDoc", fields: [sop_id], references: [document_id])
  
  noc_id           String
  noc              Documents         @relation("NOCDoc", fields: [noc_id], references: [document_id])
  
  marks_memo_id    String
  marks_memo       Documents         @relation("MemoDoc", fields: [marks_memo_id], references: [document_id])
  
  status           ApplicationStatus @default(Pending)
  
  mentor_id        String?
  mentor           MentorDetails?    @relation(fields: [mentor_id], references: [uid])
  
  preferred_locations String

  shortlist_record   Shortlist?
}

model Shortlist {
  application_id      String         @id
  application         Applications   @relation(fields: [application_id], references: [application_id])
  
  student_id          String
  student             StudentDetails @relation(fields: [student_id], references: [uid])

  committee_member1   String
  member1_score       ScoreCriteria
  
  committee_member2   String
  member2_score       ScoreCriteria
  
  committee_member3   String
  member3_score       ScoreCriteria
  
  final_category      InternshipType
  decision            Decision
}

model Stipend {
  uid            String         @id
  student        StudentDetails @relation(fields: [uid], references: [uid])
  pan            String         @unique
  account_number String         @unique
  ifsc_code      String
  bank_name      String
  bank_branch    String
}
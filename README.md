# SocietyPulse

A smart society maintenance and complaint management platform that connects residents with society administrators through structured complaint tracking, SLA monitoring, prioritization, analytics, notifications, and complaint history.

## 🌐 Hosted Application

**Production:** https://societypulse.vercel.app

## 🔐 Demo Login Credentials

### Admin

* Email: `admin@societypulse.demo`
* Password: `Admin@12345`

### Resident

* Email: `aarav@societypulse.demo`
* Password: `Resident@123`

---

# ✨ Features

## Resident Features

* Secure resident authentication
* Resident dashboard
* Submit maintenance complaints
* Select complaint category, severity, and location
* Track complaint status
* View complaint history
* View complaint details
* Add comments to complaints
* Rate resolved complaints
* View society notices
* Receive complaint-related notifications
* Automatic complaint priority calculation
* Automatic SLA assignment
* Overdue complaint tracking

## Admin Features

* Secure administrator authentication
* Admin dashboard with maintenance metrics
* View and manage complaints
* Update complaint status
* Assign complaints
* Add administrative comments
* View complaint history
* Manage complaint groups
* Detect recurring issues
* SLA compliance monitoring
* Overdue complaint detection
* Complaint analytics
* Category-wise analytics
* Priority-wise analytics
* Status-wise analytics
* Location-wise analytics
* Complaint trend analysis
* Maintenance health metrics
* Society notice management
* Notification management

---

# 🚀 Novelty Features

SocietyPulse goes beyond a basic complaint submission system by introducing several intelligent maintenance-management features.

### 1. Dynamic Complaint Priority

Every complaint receives a priority score based on:

* Severity of the issue
* Estimated number of affected residents

The system automatically converts this score into:

* LOW
* MEDIUM
* HIGH
* CRITICAL

This helps administrators focus on the most important issues first.

### 2. SLA-Aware Complaint Management

Complaints can automatically receive an SLA based on:

* Complaint category
* Priority level

The system calculates a resolution deadline (`dueAt`) when the complaint is created.

### 3. Automatic Overdue Detection

SocietyPulse compares complaint SLA deadlines with the current time to identify overdue complaints.

Administrators can therefore distinguish between:

* Active complaints
* SLA-compliant complaints
* Overdue complaints
* Resolved complaints

### 4. Recurring Complaint Detection

Complaints are grouped using:

* Society
* Category
* Location

When multiple complaints concern the same category and location, SocietyPulse identifies the issue as a recurring problem.

This allows administrators to recognize systemic maintenance problems rather than treating every complaint as an isolated incident.

### 5. Complaint History

Status changes are recorded as historical events instead of simply overwriting the current status.

This creates an auditable timeline of complaint progress.

### 6. Maintenance Health Analytics

The admin dashboard provides aggregated maintenance information including:

* Complaint volume
* Complaint status distribution
* Priority distribution
* Category distribution
* Location distribution
* Complaint trends
* SLA compliance
* Recurring issues

These metrics provide administrators with a higher-level view of society maintenance health.

---

# 🏗️ Technology Stack

* **Frontend:** Next.js 16
* **Language:** TypeScript
* **UI:** React + Tailwind CSS
* **Backend:** Next.js App Router API Routes
* **Authentication:** NextAuth.js
* **Database:** PostgreSQL
* **Database Hosting:** Neon
* **ORM:** Prisma
* **Deployment:** Vercel

---

# 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM.

## Main Entities

### Society

Stores society-level information.

### User

Stores resident and administrator accounts.

Important roles:

* `RESIDENT`
* `ADMIN`

### Location

Represents society locations such as blocks, floors, or other maintenance areas.

### Complaint

The central entity of the application.

Stores:

* Title
* Description
* Category
* Severity
* Priority score
* Priority label
* Status
* Reporter
* Society
* Location
* Complaint group
* SLA
* SLA deadline
* Estimated affected residents
* Creation timestamp

### ComplaintComment

Stores comments associated with complaints.

### ComplaintStatusHistory

Maintains an auditable history of complaint status changes.

### ComplaintGroup

Groups related complaints to identify recurring maintenance issues.

### SLA

Defines expected resolution times based on complaint characteristics.

### SatisfactionRating

Stores resident feedback after complaint resolution.

### Notice

Stores announcements published for society residents.

---

# 🔄 Complaint Lifecycle

A typical complaint follows this flow:

```text
Resident submits complaint
        ↓
Complaint validated
        ↓
Category + Severity + Affected Residents
        ↓
Priority Score calculated
        ↓
Priority Label assigned
        ↓
Matching SLA identified
        ↓
SLA deadline calculated
        ↓
Complaint grouped with related issues
        ↓
Admin reviews complaint
        ↓
Status updates recorded in history
        ↓
Complaint resolved / closed
        ↓
Resident can provide rating
```

---

# ⏰ Overdue Detection

When a complaint is created, the system attempts to identify the most appropriate SLA.

The SLA resolution time is converted into a deadline:

```text
dueAt = complaint creation time + SLA resolution hours
```

The administrator dashboard compares the current time against this deadline.

A complaint is considered overdue when:

```text
current time > dueAt
```

while the complaint is still unresolved.

This allows administrators to monitor SLA violations and prioritize delayed maintenance work.

---

# 🔔 Notification Flow

SocietyPulse supports notification-driven maintenance management.

The general notification flow is:

```text
Complaint / SLA event
        ↓
System identifies relevant event
        ↓
Notification generated
        ↓
Relevant user receives notification
        ↓
Notification can be marked as read
```

Notification functionality is available for both resident and administrator workflows where applicable.

---

# 🧾 Complaint History Model

SocietyPulse does not rely only on the current complaint status.

Instead, status changes are preserved through a dedicated `ComplaintStatusHistory` model.

For example:

```text
OPEN
 ↓
IN_PROGRESS
 ↓
RESOLVED
 ↓
CLOSED
```

Each transition can be retained as a historical record.

This provides:

* Auditability
* Transparency
* Complaint lifecycle tracking
* Better administrator visibility
* A foundation for future response-time analytics

---

# 📸 Photo Handling

The complaint model supports an optional `photoUrl` field for attaching visual evidence to a complaint.

The intended photo workflow is:

```text
Resident selects complaint photo
        ↓
Image uploaded
        ↓
Image URL associated with complaint
        ↓
Complaint stores photo reference
        ↓
Photo can be displayed with complaint details
```

The application validates uploaded image files and applies a size restriction before processing.

> Note: The current production version does not depend on photo uploads for the core complaint workflow.

---

# 🔌 API Overview

SocietyPulse uses Next.js API routes.

## Authentication

```text
/api/auth/[...nextauth]
```

Handles authentication using NextAuth.

## Registration

```text
POST /api/auth/register
```

Creates a resident account.

## Complaints

```text
GET  /api/complaints
POST /api/complaints
```

Used for resident complaint operations.

## Locations

```text
GET /api/locations
```

Retrieves locations available to the authenticated resident's society.

## Admin Complaints

```text
GET /api/admin/complaints
GET /api/admin/complaints/[id]
POST /api/admin/complaints/[id]/status
```

Used for administrator complaint management.

## Assignment

```text
POST /api/admin/complaints/assign
```

Assigns complaints for administrative handling.

## Comments

```text
POST /api/admin/complaints/comment
POST /api/resident/complaints/comment
```

Supports complaint discussions.

## Ratings

```text
POST /api/resident/complaints/rating
```

Allows residents to submit satisfaction ratings.

## Notices

```text
GET  /api/admin/notices
POST /api/admin/notices
```

Used for society notice management.

---

# 🛠️ Local Development Setup

## 1. Clone the repository

```bash
git clone https://github.com/tinni2812/societypulse.git
cd societypulse
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env` file based on `.env.example`.

Required environment variables include:

```env
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
```

Never commit real secrets to GitHub.

## 4. Generate Prisma Client

```bash
npx prisma generate
```

## 5. Apply database migrations

```bash
npx prisma migrate dev
```

## 6. Start development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

# 🧪 Production Build

To verify the application before deployment:

```bash
npm run build
```

A successful build confirms that the application compiles successfully and TypeScript checks pass.

---

# ☁️ Deployment

SocietyPulse is deployed using Vercel.

The production application is:

https://societypulse.vercel.app

The PostgreSQL database is hosted using Neon.

---

# 🔒 Security

The project follows several security practices:

* Authentication-protected routes
* Role-based authorization
* Resident/admin access separation
* Society-level data isolation
* Server-side validation
* Environment variables for secrets
* Database-backed authentication
* Protected administrative APIs

Sensitive environment variables must never be committed to GitHub.

---

# 📁 Project Structure

```text
societypulse/
├── app/
│   ├── admin/
│   ├── api/
│   ├── resident/
│   ├── login/
│   └── register/
├── lib/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── package.json
├── README.md
└── .env.example
```

---

# 🎯 Project Objective

SocietyPulse aims to improve residential society maintenance by replacing fragmented complaint handling with a structured digital workflow.

Instead of simply recording complaints, the platform considers:

* Severity
* Number of affected residents
* Priority
* SLA deadlines
* Recurring issues
* Location
* Complaint history
* Resident satisfaction
* Maintenance trends

This allows society administrators to move from reactive complaint handling toward data-driven maintenance management.

---

# 👨‍💻 Project Status

SocietyPulse is deployed and operational as a full-stack web application.

**Production URL:** https://societypulse.vercel.app

**Source Code:** https://github.com/tinni2812/societypulse

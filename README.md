# Vertexia OS
### One Platform. Complete Business Control.

**Vertexia OS** is the internal business management and operations operating system engineered specifically for **Vertexia**, a software company operating in Karachi, Pakistan. 

Vertexia specializes in software products for enterprise and retail operations—principally Point of Sale (POS) and CRM solutions. This platform is not a generic CRM or an agency dashboard: it is a centralized business operating platform connecting lead discovery, deal negotiation, client workspaces, multi-branch deployments, software license records, invoicing, cash collections, expense disbursements, engineering projects, and customer helpdesk tickets into a single source of truth.

---

## 1. System Architecture & Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript 5 (Strict type checking)
- **UI & Styling**: Tailwind CSS, DM Sans (Headings), Plus Jakarta Sans (Body text), Lucide Icons
- **Database & ORM**: PostgreSQL / SQLite (Configurable via `DATABASE_URL`), Prisma ORM 6
- **Financial & Documents**: jsPDF, jspdf-autotable (Real vector PDF invoice generation)
- **Validation & Forms**: Zod, React Hook Form
- **Security**: bcryptjs password hashing, HTTP-only secure cookie session tokens, server-side RBAC permissions, and tamper-evident audit logs

---

## 2. Company Context & Core Rules

### Current Software Products
1. **Vertexia Pharmacy POS** (Active, v2.4.0): Flagship pharmacy management and point-of-sale software with an owner mobile application, remote business monitoring, and medicine batch/expiry control.
2. **Vertexia Garage CRM** (Active, v1.8.0): Workshop management, vehicle service history, job cards, parts inventory, and billing.
3. **Vertexia Restaurant POS** (In Development, v0.9.0-beta): Table layouts, kitchen display system (KDS), recipe costing, and fast checkout.
4. **Vertexia Mini Mart POS** (In Development, v0.5.0-alpha): Retail point-of-sale for mini marts, grocery stores, wholesale/retail pricing, and fast barcode scanning.

### Team Directory & Roles
- **Taha Awan** — Founder (Universal permissions, executive settings, financial overview, audit logs)
- **Muhammad Ammar** — Co-founder (Operations, business development, technician oversight)
- **Muzammil** — Designer (UI/UX design, visual identity, documents)
- **Coming Soon** — Reserved future engineering/growth position (*Reserved placeholder, not an employee account*)

### Financial Safeguards & Historical Installations Reconciler
- **Historical Installations**: Vertexia has 5 historical installations reported. These are reconciled directly against actual client and branch records rather than populated as unverified vanity dashboard numbers.
- **Cash vs Pipeline**: Deal opportunity amounts in CRM are never treated as realized revenue.
- **Invoices & Receipts**: Invoiced amounts are only marked as collected cash when a verified payment transaction is recorded and allocated.
- **MRR Guard**: Lifetime perpetual license sales are never factored into Monthly Recurring Revenue (MRR). Only active monthly/yearly subscriptions contribute to recurring revenue calculations.
- **Safe Currency**: Default currency is PKR (Pakistani Rupee) with safe decimal formatting.

---

## 3. Application Modules

| Module | Route | Capabilities |
| :--- | :--- | :--- |
| **Executive Dashboard** | `/` | 10 real-time KPI cards, pipeline stages, action items, product portfolio, ticket alerts |
| **Activity Center** | `/activity` | Chronological audit trail of all company actions across leads, deals, payments, and tickets |
| **CRM & Leads** | `/crm/leads` | Leads directory with Table & Kanban views, stage progression, CSV export, duplicate detection |
| **Lead Workspace** | `/crm/leads/[id]` | Contact info, communication logger (Calls/WhatsApp/Meetings), next follow-up scheduler, **Lead to Customer conversion** |
| **Follow-up Center** | `/crm/follow-ups` | Today's, overdue, and upcoming follow-ups with quick completion and reschedule actions |
| **Client Management** | `/clients` | Client directory, multi-branch tracking, total invoiced vs cash received vs balance due |
| **Client Workspace** | `/clients/[id]` | **8 Tabs**: 1. Overview, 2. Products, 3. Branches, 4. Installations, 5. Finance, 6. Support, 7. Activity, 8. Documents |
| **Product Portfolio** | `/products` | Portfolio catalog with versioning, release changelogs, feature specifications, and pricing tiers |
| **Product Detail** | `/products/[id]` | **8 Tabs**: 1. Overview, 2. Features, 3. Pricing, 4. Releases, 5. Installations, 6. Projects, 7. Bug Reports, 8. Documentation |
| **Installations & Licenses** | `/installations` | Deployed software licenses, license key generator (`VTX-XXXX-XXXX-XXXX`), renewal reminders |
| **Installation Detail** | `/installations/[id]` | License certificate, client terminal version, deployment timeline, and one-click renewal |
| **Finance Overview** | `/finance` | Cash received, total invoiced, uncollected receivables, expenses, and net cash flow |
| **Invoices** | `/finance/invoices` | Invoice creation with multiple line items, discount, tax, payment terms, and status tracking |
| **Invoice Detail & PDF** | `/finance/invoices/[id]` | **Real vector PDF invoice generator**, payment allocation modal (full & partial payments) |
| **Expenses** | `/finance/expenses` | Operating disbursements by category (hosting, domains, marketing, office, hardware) |
| **Projects & Tasks** | `/projects` | Internal engineering sprints vs client onboarding projects, interactive **Tasks Kanban Board** |
| **Support Helpdesk** | `/support` | Ticket table with priority tags (Low to Critical), technician assignment, open ticket counters |
| **Ticket Detail** | `/support/[id]` | Issue conversation thread, internal technician notes (private), resolution notes |
| **Team Management** | `/team` | Team directory, organizational departments, and granular Role Permission Matrix |
| **Documents Vault** | `/documents` | Central repository for client agreements, software certificates, and legal files |
| **Reports & Analytics** | `/reports` | Financial statements, lead acquisition channels, product deployment charts |
| **Knowledge Base & SOPs** | `/knowledge-base` | Company handbook, sales scripts, deployment checklists, and technical documentation |
| **Central Notifications** | `/notifications` | Due follow-ups, overdue invoices, expiring licenses, and new ticket alerts |
| **Settings** | `/settings` | Company details, default timezone (`Asia/Karachi`), currency (`PKR`), invoice prefixes |
| **Security & Audit Logs** | `/audit-logs` | Immutable audit trail recording user logins, financial transactions, and entity mutations |
| **Global Search** | `⌘K` / `Ctrl+K` | Unified search across leads, clients, invoices, products, installations, tasks, and tickets |

---

## 4. Getting Started & Setup

### Prerequisites
- Node.js 18+ (tested on Node v26.11.1)
- npm 9+

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Contents of `.env`:
```env
DATABASE_URL="file:./dev.db"
APP_SECRET="vertexia-os-production-secret-key-32chars-min-981247"
NEXT_PUBLIC_APP_NAME="Vertexia OS"
NEXT_PUBLIC_APP_TAGLINE="One Platform. Complete Business Control."
NEXT_PUBLIC_DEFAULT_CURRENCY="PKR"
NEXT_PUBLIC_DEFAULT_TIMEZONE="Asia/Karachi"
```

> **PostgreSQL Configuration**: To switch to PostgreSQL in production, simply update `DATABASE_URL` to your postgres connection string (e.g. `postgresql://user:password@localhost:5432/vertexia_os?schema=public`) and set `provider = "postgresql"` in `prisma/schema.prisma`.

### Database Generation & Seeding
```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed initial roles, team members, products, lead sources, and SOPs
npm run db:seed
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Credentials for Initial Access
| Account | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Taha Awan** | Founder | `taha@vertexia.pk` | `vertexia2026!` |
| **Muhammad Ammar** | Co-founder | `ammar@vertexia.pk` | `vertexia2026!` |
| **Muzammil** | Designer | `muzammil@vertexia.pk` | `vertexia2026!` |

---

## 5. Verified End-to-End Workflows

Vertexia OS includes an automated workflow test suite (`scripts/test-workflows.js`) verifying all critical business sequences:

```bash
node scripts/test-workflows.js
```

**Tested Workflows**:
- **Workflow A (Lead to Customer)**: Lead captured -> Duplicate check passed -> Converted to Client -> Main Branch created -> Lead marked Won and history preserved.
- **Workflow B (Installation & Licensing)**: Product linked -> Installation deployed -> License key generated (`VTX-XXXX-XXXX-XXXX`) -> Validated under client profile.
- **Workflow C (Payment Management)**: Invoice generated with line items -> Partial payment recorded -> Allocated to invoice -> Status transitions to `PARTIALLY_PAID` -> Remaining balance recalculated -> Final payment marks invoice `PAID`.
- **Workflow D (Support Resolution)**: Ticket created -> Technician assigned -> Internal log updated -> Resolved with resolution notes.
- **Workflow F (License Renewal)**: Approaching expiry detected -> License renewed for 365 days -> License audit history updated.

---

## 6. Build & Production Verification

```bash
# Run full Next.js production build and type checking
npm run build

# Start production server
npm start
```
Production build compiles all 37 dynamic routes and APIs with zero TypeScript or bundling errors.

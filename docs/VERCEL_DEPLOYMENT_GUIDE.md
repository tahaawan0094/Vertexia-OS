# Vertexia OS — Vercel & MongoDB Atlas Production Deployment Guide

This guide provides step-by-step instructions to deploy **Vertexia OS** to **Vercel** with **MongoDB Atlas**.

---

## 1. Setup MongoDB Atlas (Cloud Database)

1. Go to **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** and sign in or create a free account.
2. Click **Create a Deployment** and choose the **M0 Free Cluster** (e.g. AWS / Frankfurt or nearest region).
3. Under **Security Quickstart**:
   - Create a database user (e.g. Username: `vertexia_admin`, Password: `YourSecurePassword123!`).
   - Under **IP Access List**, click **Allow Access from Anywhere (`0.0.0.0/0`)** — required because Vercel serverless functions use dynamic IP addresses.
4. Click **Database** -> Click **Connect** on your cluster:
   - Select **Drivers** (Node.js).
   - Copy your connection string. It will look like:
     ```text
     mongodb+srv://vertexia_admin:<password>@cluster0.abcde.mongodb.net/vertexia_os?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password and ensure the database name at the end is `/vertexia_os`.

---

## 2. Migrate Local Data to MongoDB Atlas

Run the included automated migration script on your local machine to transfer all existing Vertexia clients, authentic products, team members, and settings to your cloud MongoDB:

```bash
node scripts/migrate-sqlite-to-mongodb.js "YOUR_MONGODB_ATLAS_CONNECTION_STRING"
```

You will see:
```text
✓ Successfully connected to MongoDB Atlas!
✓ Imported 2 documents into "products"
✓ Imported 1 documents into "clients"
...
🎉 MIGRATION COMPLETED SUCCESSFULLY!
```

---

## 3. Push Project to GitHub

Initialize and push your repository to GitHub:

```bash
git add .
git commit -m "feat: configure Vertexia OS for Vercel deployment with MongoDB Atlas"
git branch -M main
git remote add origin https://github.com/<your-username>/vertexia-os.git
git push -u origin main
```

---

## 4. Deploy on Vercel

1. Log into **[Vercel](https://vercel.com)**.
2. Click **Add New...** -> **Project**.
3. Import your `vertexia-os` GitHub repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `prisma generate && next build` (automated by `vercel.json`)
5. Under **Environment Variables**, add the following:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `mongodb+srv://.../vertexia_os?retryWrites=true&w=majority` | MongoDB Atlas Connection String |
| `MONGODB_URI` | `mongodb+srv://.../vertexia_os?retryWrites=true&w=majority` | MongoDB Atlas URI for Mongoose |
| `APP_SECRET` | `vertexia-os-production-secret-key-32chars-min-981247` | 32+ char session encryption key |
| `NEXT_PUBLIC_APP_NAME` | `Vertexia OS` | Application Brand Title |
| `NEXT_PUBLIC_APP_TAGLINE` | `One Platform. Complete Business Control.` | Tagline |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | `PKR` | Primary Currency |
| `NEXT_PUBLIC_DEFAULT_TIMEZONE` | `Asia/Karachi` | Operating Timezone |

6. Click **Deploy**. Vercel will build and launch your production application in ~1-2 minutes!

---

## 5. User & Role Management (Security Post-Deployment)

- Log in as the Founder (`taha@vertexia.pk` or `ammar@vertexia.pk`).
- Open **User & Role Management** (`/admin/users`) in the left navigation under **SYSTEM**.
- As Admin/Founder you can:
  - Create new user accounts with designated roles (`Admin`, `Developer`, `Sales`, `Support`, `Finance`).
  - Deactivate/Activate team member logins instantly.
  - Reset user passwords with session invalidation.
  - Create and configure custom RBAC permissions.
- **Server-side Security**: Non-admin users are strictly rejected with HTTP 403 Forbidden on all `/api/admin/*` endpoints and blocked by server-side checks.

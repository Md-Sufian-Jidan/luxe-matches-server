# 🚀 LuxeMatches Server

This is the **backend server** for **LuxeMatches** — a modern matrimonial matchmaking platform.  
It handles authentication, biodata management, contact requests, payment processing, and admin approvals.

---

## ⚙️ Tech Stack

- **Node.js** (runtime)
- **Express.js** (server framework)
- **MongoDB** (database)
- **JWT (jsonwebtoken)** (authentication)
- **Stripe** (payment gateway)
- **dotenv** (environment variable management)
- **CORS** (cross-origin resource sharing)

---

## 📦 Main Dependencies

| Package        | Purpose |
|----------------|---------|
| express        | Routing, middleware, API server |
| mongodb        | Database connection (native MongoDB driver) |
| jsonwebtoken   | Secure authentication via access tokens |
| stripe         | Payment processing (Contact request checkout) |
| dotenv         | Secure environment variable loading |
| cors           | Allow frontend (client) to connect to backend |


---

## 🔐 Authentication & Authorization

- Users login via email/password or Google Sign-In (JWT tokens issued)
- Protected routes with `verifyJWT` middleware
- Admin-only routes protected by `verifyAdmin`

---

## 💳 Payments (Stripe Integration)

- Contact info request requires a **$5 Stripe payment**.
- Stripe PaymentIntent is created and confirmed.
- After successful payment, the request is saved to database (pending approval).

---

## 📂 Important Environment Variables (`.env`)

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
STRIPE_SECRET_KEY=your_stripe_private_key
CLIENT_URL=https://your-client-side-url.com

---

## 🛠️ Installation & Setup

```bash
# Clone the repo
git clone https://github.com/Md-Sufian-Jidan/luxe-matches-server.git

# Move into the project
cd luxe-matches-server

# Install dependencies
npm install

# Add your MongoDB credentials to .env
cp .env.example .env

# Run the server
node index.js

✅ Server is running on port 5000
🗄️ Connected to MongoDB

# Geetanjali Canteen Management System

Welcome to the **Geetanjali Canteen Management System**. This application provides a unified digital experience for parents, teachers, and school administration to manage canteen orders, subscriptions, and reservations.

This documentation serves as a comprehensive guide on how to start the application and how different user roles (Parents, Teachers, Admins) interact with the system.

---

## 1. Getting Started (For Developers & IT)

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (A MongoDB connection string is required, or the app will operate using its local `fallback.json` database)

### Installation
1. Clone the repository to your local machine.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory and add the following keys (refer to `.env.example` if available):
```env
# Optional: Set this to your MongoDB connection string
MONGODB_URI=your_mongodb_cluster_url
# Used for encrypting JWT tokens
JWT_SECRET=super_secret_key_123
```

### Running the Application
**Development Mode:**
Starts the Vite React frontend and Express backend concurrently.
```bash
npm run dev
```

**Production Mode:**
To run a fully compiled, optimized version of the app:
```bash
npm run build
npm start
```
The application will be accessible via **http://localhost:3000** (or whatever URL your hosting provider assigns).

---

## 2. User Guides

### 2.1 Parent Guide

**A. Creating an Account & Logging In**
1. Open the application.
2. Click **"Login/Signup"** from the navigation bar.
3. Choose the **Student/Parent** tab to register or log in.
4. Fill out your Name, Email, Mobile Number, and Password to create an account.

**B. Adding a Child (Student)**
*Before placing an order for a child, you must link their student profile to your account.*
1. Navigate to the **Profile** section (click your avatar/name in the top right).
2. Look for the **"My Children"** or **"Add Student"** section.
3. Fill out the child's details: **Name, Age, Class/Grade, Section**, and **Roll No**.
4. Click **"Save Child"**. You can add multiple children if needed.

**C. Ordering Food**
1. Browse the **Menu** page to see available items.
2. Click **"Add to Cart"** for the desired items.
3. Click the **Cart Summary/Drawer**.
4. Under "Select Student", use the dropdown to assign the order to a specific child you added earlier.
5. Proceed to **Checkout** and finalize the payment (via Counter or UPI).

**D. Subscribing to Weekly Plans**
1. Go to the **Plans** page.
2. Review the subscription packages available for the week.
3. Select a package, assign it to a specific child, and complete the subscription.

---

### 2.2 Teacher / Faculty Guide

**A. Creating a Teacher Account**
1. Click **"Login/Signup"** from the navigation bar.
2. Switch over to the **Faculty/Staff** tab.
3. Register using your Teacher/Staff details (Name, Email, Phone, Password).

**B. Ordering Food**
1. Go to the **Menu** page and add items to your cart.
2. Open the Cart Drawer. Since you are a Teacher, the system recognizes you automatically and does not require you to assign the order to a "Student".
3. Checkout and complete the payment.

**C. Booking a Table (Reservations)**
*Teachers have the special privilege of reserving tables in the canteen to skip lines or prep for meetings.*
1. Go to the **Reservations** page.
2. Provide details: Date, Time, Number of Guests, and any special seating preferences (e.g., VIP, First Class Elite).
3. Confirm the reservation. You can track its approval status in your profile or notifications.

---

### 2.3 System Administrator Guide

**A. Accessing the Dashboard**
1. Log in using an Admin account (usually defined in the database directly, or configured to flag `isAdmin: true` for specific emails).
2. The navbar will display a specialized link: **Admin Dashboard**.
3. Click it to enter the secure administration portal.

**B. Reviewing Analytics & Sales**
1. The **Overview** tab shows live Daily Revenue, Order Volumes, and insights.
2. The **Analytics** page offers deeper metrics on popular items and financial histories.

**C. Managing Orders**
1. Navigate to the **Orders** tab in the sidebar.
2. Here, you'll see a real-time list of all incoming orders (from Parents and Teachers).
3. Use the action buttons to update the status of an order (e.g., mark as `Processing` or `Delivered`).

**D. Managing Students & Users**
1. Navigate to the **Students** or **Teachers** tabs.
2. Use this area to track which parents have attached which kids, monitor their account status, or moderate users using the search and filter functions.

**E. Notifications & Muting**
1. The Admin Dashboard features a **Bell Icon** that alerts staff when a new order or reservation arrives.
2. You can use the **Sound Toggle** to mute/unmute notification chimes based on the canteen's noise requirements.

---

## 3. Support & Troubleshooting

- **Forgot Password:** Use the "Forgot Password?" link on the login modal to receive a reset link/code to your registered email.
- **Missing Students:** If a parent adds a child but they don’t appear in the cart, ensure they refresh the page or verify the save was successful in the Profile tab.
- **Failures on Saving Details:** Ensure all required fields (Name, Age, Class, Section) are accurately filled out without special characters that might trigger validation errors.

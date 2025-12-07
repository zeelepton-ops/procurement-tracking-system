# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
Open PowerShell in the project directory and run:
```powershell
npm install
```

### Step 2: Setup Database
```powershell
npx prisma generate
npx prisma db push
```

### Step 3: Add Sample Data (Optional but Recommended)
```powershell
node prisma/seed.js
```

### Step 4: Start the Application
```powershell
npm run dev
```

### Step 5: Open Your Browser
Navigate to: **http://localhost:3000**

---

## 📱 Using the Application

### Page 1: Material Request Entry
**URL:** http://localhost:3000/material-request

**Purpose:** Submit new material requests

**Steps:**
1. Select a job order
2. Choose material type (Raw Material or Consumable)
3. Enter item details and quantity
4. Set required date and urgency level
5. Click "Submit Material Request"

---

### Page 2: Procurement Tracking
**URL:** http://localhost:3000/procurement

**Purpose:** Track and manage material requests through procurement workflow

**Features:**
- View all material requests with filters
- Select a request to see full details
- Add procurement actions:
  - Assign to procurement team
  - Request quotations
  - Record received quotations with amounts
  - Create purchase orders
  - Update status
- View complete action history

**Steps:**
1. Browse requests using filters (status, urgency, search)
2. Click on a request to see details
3. Use the "Add Action" form to update progress
4. Change status as the request moves through workflow

---

### Page 3: Live Status Dashboard
**URL:** http://localhost:3000/dashboard

**Purpose:** Real-time monitoring for all stakeholders

**Features:**
- Auto-refresh every 10 seconds
- Live statistics (Total, Pending, In Progress, Received, Urgent, Overdue)
- Switch between team views (Production/Store/Project)
- Search and filter requests
- Visual urgency and overdue alerts
- Comprehensive request tracking table

**Dashboard Updates:**
- 🟢 **Green dot** = Live connection
- **Last updated time** shown in header
- Click "Refresh" for immediate update

---

## 🎯 Key Features

### Urgency Levels
- **CRITICAL** 🔴 - Blocking production, needs immediate attention
- **HIGH** 🟠 - Important, quick action required
- **NORMAL** 🔵 - Standard priority
- **LOW** ⚪ - Can wait

### Status Flow
```
PENDING → IN_PROCUREMENT → ORDERED → PARTIALLY_RECEIVED → RECEIVED
```

### Visual Alerts
- 🔔 **Pulsing bell icon** = Urgent item (Critical/High/Due within 3 days)
- 🔴 **Red text** = Overdue items
- 🟠 **Orange background** = Urgent items in table

---

## 🔧 Troubleshooting

**Issue:** Port 3000 already in use
**Solution:** 
```powershell
npm run dev -- -p 3001
```

**Issue:** Database errors
**Solution:**
```powershell
# Reset database
rm prisma/dev.db
npx prisma db push
node prisma/seed.js
```

**Issue:** Module not found errors
**Solution:**
```powershell
# Clean install
rm -r node_modules
rm package-lock.json
npm install
```

---

## 📊 Sample Data

After running the seed script, you'll have:
- **3 Job Orders** (JO-2024-001, JO-2024-002, JO-2024-003)
- **4 Material Requests** in different statuses
- **3 Suppliers** with contact details
- **3 Inventory Items** with stock levels
- **1 Purchase Order** with line item
- Complete action history and status tracking

---

## 💡 Tips for Best Experience

1. **Start with Dashboard** - Get overview of all requests
2. **Use Filters** - Find specific items quickly
3. **Check Urgency** - Prioritize critical and high-priority items
4. **Monitor Overdue** - Red items need immediate attention
5. **Update Regularly** - Keep status current for all stakeholders
6. **Add Notes** - Document all procurement actions for transparency

---

## 🎨 Color Guide

| Color | Meaning |
|-------|---------|
| 🔴 Red | Critical, Overdue, Cancelled |
| 🟠 Orange | High Priority, Urgent |
| 🟡 Yellow | Pending, Warning |
| 🔵 Blue | Normal Priority, In Progress |
| 🟢 Green | Completed, Received |
| ⚪ Grey | Low Priority, Inactive |

---

## 📞 Support

For customization or issues:
- Check README.md for detailed documentation
- Review database schema in prisma/schema.prisma
- Use `npx prisma studio` to view/edit database directly

---

**Enjoy your new Procurement Tracking System! 🎉**

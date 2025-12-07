# Steel Production Procurement Tracking System

A comprehensive web-based ERP system for managing material requests, procurement tracking, and real-time status monitoring for steel production factories.

## Features

### 1. **Material Request Entry Page**
- Create material requests linked to job orders
- Specify raw materials or consumables
- Set quantity, unit, description, and specifications
- Define urgency levels (Low, Normal, High, Critical)
- Set required dates with visual urgency indicators
- Specify preferred suppliers
- Check current inventory stock levels
- Track reason for each request

### 2. **Procurement Tracking Page**
- View all material requests with filtering by status and urgency
- Assign requests to procurement team
- Request and record quotations from suppliers
- Update request status through procurement workflow
- Create purchase orders
- Record detailed action history
- Real-time updates every 30 seconds
- Search by request number, item name, or job order
- Visual urgency and status indicators

### 3. **Live Status Dashboard**
- Real-time monitoring with auto-refresh (10 seconds)
- View for different stakeholders:
  - Production Team
  - Store Personnel
  - Project Team
- Live statistics and KPIs:
  - Total requests
  - Pending items
  - In-progress items
  - Received items
  - Urgent items
  - Overdue items
- Comprehensive filtering and search
- Urgency alerts with visual indicators
- Overdue item tracking
- Detailed progress information for each request

## Technology Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Real-time Updates**: Auto-refresh polling

## Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Step 1: Install Dependencies

```powershell
npm install
```

### Step 2: Initialize Database

```powershell
npx prisma generate
npx prisma db push
```

### Step 3: Seed Sample Data (Optional)

```powershell
node prisma/seed.js
```

### Step 4: Run Development Server

```powershell
npm run dev
```

The application will be available at: http://localhost:3000

## Database Schema

The system includes the following main entities:

- **JobOrder**: Job orders with drawing references
- **MaterialRequest**: Material requests with all details
- **ProcurementAction**: Action history for each request
- **PurchaseOrder**: Purchase orders
- **PurchaseOrderItem**: Line items for POs
- **MaterialReceipt**: Delivery receipts
- **StatusHistory**: Status change tracking
- **Supplier**: Supplier master data
- **InventoryItem**: Current stock levels

## User Guide

### Creating a Material Request

1. Navigate to **Material Request** page
2. Select the job order
3. Choose material type (Raw Material or Consumable)
4. Enter item details, quantity, and specifications
5. Set required date and urgency level
6. Optionally specify preferred supplier
7. Submit the request

### Tracking Procurement Progress

1. Go to **Procurement Tracking** page
2. View all requests with their current status
3. Select a request to see detailed information
4. Add actions:
   - Assign to procurement
   - Request quotations
   - Record received quotations
   - Create purchase order
   - Add notes
5. Update status as the request progresses

### Monitoring Live Status

1. Open **Live Dashboard** page
2. View real-time statistics
3. Switch between team roles (Production/Store/Project)
4. Use filters to find specific requests:
   - Search by request number, item, or job order
   - Filter by status
   - Show urgent items only
5. Monitor overdue items and urgency alerts
6. Dashboard auto-refreshes every 10 seconds

## Workflow

```
1. Material Request Created (PENDING)
   ↓
2. Assigned to Procurement (IN_PROCUREMENT)
   ↓
3. Quotations Requested & Received
   ↓
4. Purchase Order Created (ORDERED)
   ↓
5. Material Delivered (PARTIALLY_RECEIVED or RECEIVED)
```

## Status Definitions

- **PENDING**: Request submitted, awaiting procurement action
- **IN_PROCUREMENT**: Being processed by procurement team
- **ORDERED**: Purchase order issued to supplier
- **PARTIALLY_RECEIVED**: Some quantity received
- **RECEIVED**: Fully received in store
- **CANCELLED**: Request cancelled

## Urgency Levels

- **LOW**: Standard requests with flexible timelines
- **NORMAL**: Regular priority requests
- **HIGH**: Important requests requiring quick action
- **CRITICAL**: Urgent requests blocking production

## Visual Indicators

- 🔴 **Red**: Critical/Overdue items
- 🟠 **Orange**: High urgency items
- 🔵 **Blue**: Normal priority items
- 🟢 **Green**: Completed items
- 🟡 **Yellow**: Pending items
- 🔔 **Bell Icon**: Urgent items (Critical/High/Due in 3 days)

## Production Build

To build for production:

```powershell
npm run build
npm start
```

## Database Management

View and edit database:
```powershell
npx prisma studio
```

Create new migration:
```powershell
npx prisma migrate dev --name your_migration_name
```

## Support & Customization

This system can be customized to include:
- Email notifications for urgent items
- PDF report generation
- Integration with existing ERP systems
- Mobile app version
- Advanced analytics and reporting
- Approval workflows
- Multi-location support

## License

Proprietary - Steel Production Factory ERP System

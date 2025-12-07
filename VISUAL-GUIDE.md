# 📸 Visual User Guide

## 🏠 HOME PAGE (/)

### What You'll See:
- **Hero Section**: Blue header with "Steel Production ERP" title
- **Three Main Cards**:
  1. **Material Request** (Blue) - Submit new requests
  2. **Procurement Tracking** (Indigo) - Manage workflow
  3. **Live Dashboard** (Green) - Real-time monitoring
- **Key Features Section**: 4 feature highlights
- **For Different Teams Section**: Role-specific information

### Navigation:
- Click any card to navigate to that page
- All pages have "Back" or "Home" links

---

## 📝 MATERIAL REQUEST ENTRY (/material-request)

### Page Layout:
```
┌─────────────────────────────────────────────┐
│  Material Request Entry                     │
│  Submit new material requests               │
├─────────────────────────────────────────────┤
│  [Success Message - if just submitted]      │
├─────────────────────────────────────────────┤
│  📦 NEW MATERIAL REQUEST                    │
│                                             │
│  Job Order: [Dropdown ▼]                   │
│  Material Type: [Dropdown ▼]               │
│                                             │
│  Item Name: [Text input]                   │
│  Stock Qty: [Number input]                 │
│                                             │
│  Description: [Text area]                  │
│                                             │
│  Quantity: [Number] Unit: [Dropdown ▼]     │
│                                             │
│  Reason: [Text area]                       │
│                                             │
│  Required Date: [Date picker]              │
│  Urgency: [Dropdown ▼]                     │
│                                             │
│  Supplier: [Text input - optional]         │
│  Requested By: [Text input]                │
│                                             │
│  [Submit Material Request] [Cancel]        │
└─────────────────────────────────────────────┘
```

### How to Use:
1. **Select Job Order** - Choose from existing job orders
2. **Material Type** - Raw Material or Consumable
3. **Item Details** - Name, description, quantity
4. **Set Dates** - When you need it
5. **Set Urgency** - How critical is it
6. **Submit** - Green button at bottom

### Form Fields:
- **Required fields** marked with *
- **Date picker** opens calendar
- **Dropdowns** show all options
- **Number inputs** allow decimals
- **Text areas** can hold multiple lines

---

## 📊 PROCUREMENT TRACKING (/procurement)

### Page Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  Procurement Tracking                                       │
│  Manage and track material request progress                 │
├─────────────────────────────────────────────────────────────┤
│  📦 Total: 4  ⏰ Pending: 1  📈 In Progress: 2  ✅ Received: 0│
├─────────────────────────────────────────────────────────────┤
│  [Search...] [Status ▼] [Urgency ▼] [Refresh]             │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────┬────────────────────────────────────┐│
│  │ REQUESTS (4)       │ REQUEST DETAILS                    ││
│  │                    │                                    ││
│  │ ┌────────────────┐ │ MR-2024-0001                      ││
│  │ │🔔 MR-2024-0001│ │ Steel Plate - Grade A36           ││
│  │ │ JO-2024-001   │ │                                    ││
│  │ │ Steel Plate   │ │ Qty: 300 KG                       ││
│  │ │ CRITICAL      │ │ Job: JO-2024-001                  ││
│  │ │ Due in 1 day  │ │                                    ││
│  │ └────────────────┘ │ ─────────────────                 ││
│  │                    │ ACTION HISTORY                     ││
│  │ [More cards...]   │ - Created by Production Team       ││
│  │                    │                                    ││
│  │                    │ ─────────────────                 ││
│  │                    │ ADD ACTION                         ││
│  │                    │ [Action Type ▼]                   ││
│  │                    │ [Notes...]                        ││
│  │                    │ [New Status ▼]                    ││
│  │                    │ [Record Action]                   ││
│  └────────────────────┴────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Left Side - Request List:
- **Card per request** with key info
- **Click to select** and view details
- **Color-coded** by urgency
- **Icons** show status
- **Scrollable** list

### Right Side - Details & Actions:
- **Full request information**
- **Action history** (chronological)
- **Add Action form** at bottom
- **Status update** dropdown
- **Quotation fields** (when applicable)

### Action Types:
1. **Add Note** - General update
2. **Assign to Procurement** - Start workflow
3. **Request Quotation** - Getting quotes
4. **Quotation Received** - Record amount
5. **PO Created** - Purchase order made

---

## 📈 LIVE STATUS DASHBOARD (/dashboard)

### Page Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  Live Status Dashboard              🟢 Live • Updated 10:30 │
│  Real-time tracking for all material requests               │
├─────────────────────────────────────────────────────────────┤
│  View as: [Production Team] [Store Person] [Project Team]  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────┬──────┬──────┬──────┬──────┬──────┐              │
│  │Total │Pending│In    │Receiv│Urgent│Overdue│            │
│  │  4   │  1   │Progress│  0   │  2   │  1    │            │
│  │      │      │  2   │      │      │       │              │
│  └──────┴──────┴──────┴──────┴──────┴──────┘              │
├─────────────────────────────────────────────────────────────┤
│  🔍 [Search...] [Status ▼] [Urgent Only] [Clear Filters]  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ REQUEST # │ JOB ORDER│ ITEM │ QTY │STATUS│URGENCY│DATE││
│  ├─────────────────────────────────────────────────────────┤│
│  │🔔MR-2024-001│JO-2024-001│Steel│300KG│PENDING│CRITICAL││
│  │           │Tank 5000L │Plate│    │      │       │1d ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ MR-2024-002│JO-2024-001│Weld │25KG│IN_PROC│HIGH  │7d ││
│  │           │Tank 5000L │Rod  │    │      │       │   ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ MR-2024-003│JO-2024-002│Angle│120M│ORDERED│NORMAL│7d ││
│  │           │Frame Struct│     │    │      │       │   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Features:
1. **Live Badge** - Green dot = system is live
2. **Last Updated Time** - Shows refresh time
3. **Statistics Cards** - 6 KPI metrics
4. **Role Switcher** - View as different teams
5. **Filters Row** - Search, filter, clear
6. **Data Table** - All requests with details

### Visual Indicators:
- 🔔 **Bell Icon** = Urgent (pulsing animation)
- 🟠 **Orange Background** = Urgent item row
- 🔴 **Red Text** = Overdue item
- **Colored Badges** = Status and urgency levels
- **Progress Info** = Last action taken

### Auto-Refresh:
- Updates every **10 seconds** automatically
- Green dot pulses during refresh
- Click **Refresh** for immediate update

---

## 🎨 Color Legend

### Status Badges:
```
┌─────────────────────────────────────┐
│ PENDING        │ Yellow background  │
│ IN_PROCUREMENT │ Blue background    │
│ ORDERED        │ Indigo background  │
│ PARTIALLY_REC  │ Purple background  │
│ RECEIVED       │ Green background   │
│ CANCELLED      │ Red background     │
└─────────────────────────────────────┘
```

### Urgency Badges:
```
┌─────────────────────────────────────┐
│ CRITICAL       │ Red background     │
│ HIGH           │ Orange background  │
│ NORMAL         │ Blue background    │
│ LOW            │ Grey background    │
└─────────────────────────────────────┘
```

### Alert Colors:
```
┌─────────────────────────────────────┐
│ 🔴 Red         │ Overdue/Critical   │
│ 🟠 Orange      │ High Priority      │
│ 🟡 Yellow      │ Warning/Pending    │
│ 🔵 Blue        │ Normal/Info        │
│ 🟢 Green       │ Success/Complete   │
└─────────────────────────────────────┘
```

---

## 🖱️ Interaction Guide

### Buttons:
- **Primary Blue** - Main actions (Submit, Record)
- **Outline** - Secondary actions (Cancel, Refresh)
- **Hover Effect** - Slightly darker on mouse over
- **Disabled State** - Greyed out when processing

### Cards:
- **Hover** - Slight shadow lift
- **Click** - Selects item (in procurement page)
- **Active** - Blue ring around selected card

### Forms:
- **Focus** - Blue ring around active field
- **Validation** - Red border if error
- **Required** - Asterisk (*) next to label

### Tables:
- **Hover** - Light grey background on row
- **Sortable** - Click column headers
- **Scrollable** - Vertical scroll if many rows

---

## 📱 Responsive Design

### Desktop (1200px+):
- Full layout with sidebars
- 3-column grids for stats
- Wide tables

### Tablet (768px - 1199px):
- 2-column layouts
- Stacked forms
- Scrollable tables

### Mobile (< 768px):
- Single column
- Stacked cards
- Touch-friendly buttons
- Simplified navigation

---

## ⌨️ Keyboard Shortcuts

### Forms:
- `Tab` - Move to next field
- `Shift+Tab` - Move to previous field
- `Enter` - Submit form (when focused on submit button)
- `Esc` - Clear/Cancel (in some forms)

### Navigation:
- Click logo/title to return home
- Browser back button works
- Use links in cards

---

## 🔔 Notification System

### Visual Alerts:
1. **Success Message** - Green banner at top
2. **Urgent Items** - 🔔 Pulsing bell icon
3. **Overdue Items** - Red text/background
4. **Live Updates** - Green dot animation

### Alert Conditions:
- **Critical Urgency** = Always shows alert
- **High Urgency** = Shows alert
- **Due in ≤ 3 days** = Shows urgency warning
- **Overdue** = Red highlighting

---

## 💡 Pro Tips

### Material Request:
- Check inventory stock before requesting
- Set realistic required dates
- Use CRITICAL sparingly (only when blocking production)
- Add detailed descriptions for clarity

### Procurement:
- Process PENDING items daily
- Record all quotations received
- Update status as soon as changes occur
- Add notes for audit trail

### Dashboard:
- Use "Urgent Only" filter to prioritize
- Check overdue items first (red)
- Search by job number for project tracking
- Switch roles to see different perspectives

---

## 🎯 Best Practices

### Data Entry:
✅ Use consistent naming conventions
✅ Include specifications in descriptions
✅ Set accurate required dates
✅ Update status promptly

### Workflow:
✅ Process requests in order of urgency
✅ Document all actions
✅ Communicate delays in notes
✅ Close completed requests

### Monitoring:
✅ Check dashboard daily
✅ Review urgent items hourly
✅ Track overdue items
✅ Plan ahead for upcoming requirements

---

**Happy Tracking! 🎉**

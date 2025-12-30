# Delivery Notes Form Enhancements

## Changes Implemented

### 1. **Auto-Fill from Job Order**
- Added `handleJobOrderChange()` function that auto-populates fields when a job order is selected
- When a job order is selected, the form automatically fills:
  - **Job Sales Order**: From job order number
  - **Client**: From job order client name
  - Other fields remain editable for customization

### 2. **Better Field Organization**
Form is now organized into 5 logical sections with visual grouping:

#### Section 1: Delivery Note Header
- Delivery Note Number (required)
- Job Order selector

#### Section 2: Client & Project Details  
- Client name
- Country
- Division
- Department
- Fabrication
- Ref/PO Number

#### Section 3: Shipment Information
- Shipment To (location)
- Shipment Type (e.g., AIR, SEA, LAND)
- Comments (textarea)

#### Section 4: Personnel Information
- Representative Name
- Representative No.
- QID Number

#### Section 5: Vehicle Details
- Vehicle Number
- Vehicle Type (NBTC, Client, Third Party)

### 3. **Search Functionality for Previous Delivery Notes**
- Added `SearchableField()` component with autocomplete
- Implemented `getSuggestions()` function that:
  - Searches through previous delivery notes
  - Filters field values containing user's typed text
  - Shows up to 5 suggestions in dropdown
  - Applies suggestions on click
  
- Fields ready for search functionality (can be enabled):
  - Shipment Type
  - Representative Name
  - Vehicle Type

### 4. **Improved Job Order Dropdown**
- Changed from custom Select component to native HTML select
- All job orders display with format: `jobNumber - productName`
- Shows available job orders from `/api/job-orders`
- Includes fallback to empty array if API fails

### 5. **Visual Improvements**
- Form sections use `bg-slate-50` background with border
- Section headers in bold for clarity
- Grid layout for better spacing (1 column on mobile, 2-3 on desktop)
- Consistent mt-2 spacing below all labels
- Loading spinner while fetching data
- Empty state message if no delivery notes exist

## Technical Details

### State Management
```typescript
- deliveryNotes: DeliveryNote[]
- jobOrders: JobOrder[]
- formData: Form state with all fields
- showForm: Toggle form visibility
- editingId: Track which note is being edited
- showSuggestions: Track open suggestion dropdowns
```

### API Integration
- Fetches job orders on page load
- Auto-fills client name from jobOrder.clientName
- Saves complete form data on submit
- Handles edit and delete operations

### Job Order Interface
```typescript
interface JobOrder {
  id: string
  jobNumber: string
  productName: string
  clientName?: string
}
```

## Usage

1. Click "New Delivery Note" to open form
2. Select a job order from dropdown
3. Form auto-fills with client details
4. Complete remaining fields
5. Click "Create Delivery Note" to save
6. View in table below with edit/delete/print options

## Future Enhancements

- Enable SearchableField for shipment-type, representative-name fields
- Add items/materials section for detailed goods tracking
- Implement status workflow (DRAFT → ISSUED → DELIVERED)
- Add email notifications on delivery status changes
- Export delivery notes to PDF directly

## Commit
Commit: `61daca9`
Message: "Enhance delivery notes form with job order auto-fill and field organization"

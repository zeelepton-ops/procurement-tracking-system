# Quick Start Guide: New Features

## Feature 1: Delete Individual Line Items from Material Requests

### Before
- Clicking delete on any item in a material request deleted the ENTIRE request
- All items in that request were lost

### After
- Each line item has its own independent delete button
- Delete only the specific item you want to remove
- Other items stay intact

### How to Use:
1. Go to Material Requests page
2. View any material request (it shows one row per item)
3. Click the red trash icon in the "Action" column for the specific item you want to delete
4. Confirm the deletion
5. ✅ Only that item is deleted - the request and other items remain

---

## Feature 2: Easy Purchase Order Creation

### Before
- Required manual JSON entry: `[{"itemKey":"MR-1","qty":10}, ...]`
- Error-prone and user-unfriendly
- No supplier details auto-population

### After
- Clean, visual interface with form fields
- Supplier dropdown with auto-population
- Professional PO creation experience

### How to Use:

#### Step 1: Fill PO Details
1. Go to **Procurement → Purchase Orders → Prepare PO**
2. Enter a **PO Number** (e.g., PO-2025-001)

#### Step 2: Select Supplier
1. Click the **Supplier dropdown**
2. All registered suppliers appear in the list
3. Select your supplier → Details auto-populate:
   - ✅ Contact Person/Email
   - ✅ Address
   - ✅ Phone
   - ✅ Payment Terms
   - ✅ Expected Delivery (calculated from lead time)

#### Step 3: Add Items
1. Enter item details:
   - **Description**: What item to order
   - **Quantity**: How much
   - **Unit**: PCS, KG, M, L, BOX, etc.
2. Click "+ Add Item" to add more items
3. Click trash icon to remove items

#### Step 4: Create PO
1. Review all details
2. Click **"Create PO"** button
3. Success! PO is created and ready

### Example Workflow:
```
PO Number: PO-2025-001
Supplier: ABC Engineering Co.
  ├─ Contact: John Doe (john@abc.com)
  ├─ Payment Terms: Net 30
  ├─ Lead Time: 7 days
  └─ Address: 123 Industrial Park, Qatar

Items:
  1. Steel Plates - 100 KG
  2. Welding Rod - 50 KG
  3. Safety Equipment - 20 PCS

✅ PO Created Successfully!
```

---

## Key Improvements

### For Material Requests
| Before | After |
|--------|-------|
| Delete whole request | Delete individual items |
| Lost all items | Keep related items |
| No item-level control | Full item independence |

### For Purchase Orders
| Before | After |
|--------|-------|
| JSON input required | Visual form interface |
| No auto-fill | Auto-populate supplier details |
| Manual entry | Dropdown selection |
| Error-prone | Validation built-in |

---

## Supplier Auto-Population Details

When you select a supplier, these fields are automatically filled:

| Field | Source | Note |
|-------|--------|------|
| **Contact** | Primary contact email | From supplier.contacts or supplier.email |
| **Address** | Supplier address | Auto-displayed for reference |
| **Phone** | Supplier phone | Auto-displayed for reference |
| **Payment Terms** | Supplier payment terms | From supplier.paymentTerms field |
| **Exp. Delivery** | Lead time + today | Auto-calculated based on supplier.leadTimeDays |

---

## Tips & Tricks

### Material Requests
- 💡 Items show individually in the list view - each row is independent
- 💡 Delete button only affects that specific row's item
- 💡 Request remains visible with remaining items

### Purchase Orders
- 💡 Supplier dropdown loads all active suppliers
- 💡 Lead time field (if available) automatically calculates delivery date
- 💡 You can edit payment terms before creating PO
- 💡 Support for multiple items in one PO
- 💡 All PO data is stored in the database

---

## Troubleshooting

### Can't see suppliers in dropdown?
- ✓ Check suppliers are registered in system
- ✓ Verify supplier status is "APPROVED"
- ✓ Refresh page to reload supplier list

### Item not deleting?
- ✓ Confirm you clicked the trash icon for the right item
- ✓ Material request must not be locked/archived
- ✓ You must have delete permissions

### PO not saving?
- ✓ Verify PO number is unique (not duplicate)
- ✓ Ensure all required fields are filled
- ✓ Check at least one item is added

---

## Questions?

For issues or feedback about these new features, contact your system administrator.

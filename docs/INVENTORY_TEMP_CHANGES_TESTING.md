# Quick Start: Testing Temporary Changes Feature

## How to Use the Feature

### Step 1: Access Inventory Management
1. Log in as a branch manager
2. Navigate to **Branch Dashboard** → **Inventory Management**

### Step 2: Schedule a Temporary Change
1. Hover over any menu item in the list
2. Click the **Clock icon** (appears on hover)
3. The **"Temporary Changes" modal** opens

### Step 3: Configure the Schedule
1. **Toggle "Enable Schedule"** to ON (green switch)
   - The toggle must be ON for changes to apply
   
2. **Set Start Date & Time**
   - Click the start date/time input
   - Select a time within the next hour for testing
   - Example: If current time is 2:00 PM, set start time to 2:05 PM
   
3. **Set End Date & Time**
   - Click the end date/time input
   - Set an end time 1-2 hours after start time
   - Example: If start is 2:05 PM, set end to 3:05 PM
   
4. **Optional - Set Temporary Price**
   - Leave blank to keep original price
   - Or enter a new price (e.g., 150 instead of 200)
   
5. **Optional - Set Temporary Name**
   - Leave blank to keep original name
   - Or enter a promotional name (e.g., "Special Edition")
   
6. **Optional - Set Availability**
   - Toggle "Available" or "Unavailable"
   - By default, items remain available

### Step 4: Save Changes
1. Click **"Save Changes"** button
2. Modal will close automatically
3. Menu refreshes to show the updated item

### Step 5: Verify the Changes
1. **During the scheduled window (between start and end time)**:
   - Open the customer menu
   - Check if the item shows the temporary price/name
   - Check if availability is as configured

2. **Outside the scheduled window**:
   - Item reverts to original price/name/availability
   - The `temporaryChanges` settings remain saved for future use

## Real-Time Testing Scenario

### Test 1: Quick Price Promotion
**Time Required**: 5 minutes

1. Pick a menu item (e.g., "Cappuccino" - ₹180)
2. Open Temporary Changes
3. Toggle ON
4. Set start time: NOW
5. Set end time: NOW + 5 minutes
6. Set temporary price: 150
7. Click Save
8. Open customer menu immediately
   - ✅ Should see price as ₹150
9. Wait 6 minutes
10. Refresh customer menu
    - ✅ Should revert to ₹180

### Test 2: Schedule Future Event
**For future promotions**

1. Pick a menu item
2. Open Temporary Changes
3. Toggle ON
4. Set start time: Tomorrow at 10:00 AM
5. Set end time: Tomorrow at 6:00 PM
6. Set temporary name: "Weekend Special"
7. Set temporary price: 120
8. Click Save
9. Check menu now
   - ✅ Should still show original name/price
10. Check menu tomorrow during window
    - ✅ Should show "Weekend Special" at 120

### Test 3: Availability Window
**Limiting item availability by time**

1. Pick a popular item
2. Open Temporary Changes
3. Toggle ON
4. Set time window: Next 30 minutes
5. Toggle Availability: "Unavailable"
6. Click Save
7. Check customer menu now
   - ✅ Item should appear as "OUT OF STOCK" or disabled
8. Wait 35 minutes
   - ✅ Item should become available again

## Bulk Operations

### Enable Multiple Items
1. Check items in the list (left column)
2. Click **"Enable"** in the bulk action bar
3. Items marked for enablement

### Disable Multiple Items
1. Check items in the list
2. Click **"Disable"** in the bulk action bar
3. Items marked for disablement

## Troubleshooting

### Issue: Changes Not Appearing
**Solution**:
- ✅ Verify the toggle "Enable Schedule" is ON (green)
- ✅ Verify current time is between start and end times
- ✅ Check browser console for API errors
- ✅ Try refreshing the menu page

### Issue: Modal Doesn't Open
**Solution**:
- ✅ Make sure you're hovering over an item (shows gray background)
- ✅ Check that JavaScript is enabled
- ✅ Try refreshing the page

### Issue: Error Saving
**Solution**:
- ✅ Check all required fields are filled (dates when enabled)
- ✅ Verify end time is after start time
- ✅ Check network connection
- ✅ Try again in a few seconds

## Key Points to Remember

- ✅ **Temporary changes only apply during the scheduled time window**
- ✅ **Original item data is never deleted, just overridden**
- ✅ **Customers always see the "correct" price/name** (with temporary applied if in window)
- ✅ **Server time is used for comparison**, not client time
- ✅ **Multiple schedule edits overwrite previous settings**
- ✅ **Bulk actions work alongside temporary changes**

## Icon Indicators

| Icon | Meaning |
|------|---------|
| ⏰ (Clock) | Temporary Changes feature |
| 🟢 Green dot | Schedule is currently active |
| 🔄 Pulsing dot | Schedule enabled in modal |
| 🟠 Amber bg | Item has active schedule |

## API Endpoints Used

- `PUT /api/branch/menu/:id/temporary-changes` - Save changes
- `GET /api/branch/menu` - Fetch menu with applied changes

## Common Use Cases

1. **Happy Hour**: Set lower prices from 3-5 PM
2. **Promotional Item**: Set special name and price on weekends
3. **Out of Stock Temporarily**: Disable item from 6-8 PM when stock runs out
4. **Special Edition Menu**: Change available items during special events
5. **Testing New Pricing**: Try new prices for limited time before making permanent

---
**Ready to test!** Follow the scenarios above to verify the feature works correctly.

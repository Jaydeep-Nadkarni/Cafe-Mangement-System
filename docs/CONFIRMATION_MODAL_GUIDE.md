# Custom Confirmation Modal System

## Overview
Replaced all browser `alert()` and `confirm()` dialogs with a reusable, styled `ConfirmationModal` component. This provides a consistent, professional user experience with clear visual hierarchy and accessibility support.

## Benefits
- **Consistent UX**: All modals follow the same design pattern
- **Accessibility**: Proper ARIA attributes, keyboard navigation, and semantic HTML
- **Destructive Actions**: Red styling for dangerous operations (delete, disable, etc.)
- **No Nested Modals**: Modal state prevents multiple dialogs from appearing simultaneously
- **Scroll Preservation**: Backdrop blur without body scroll locks prevents scroll jumpiness

## Component Architecture

### ConfirmationModal Component
Located in: `client/src/admins/components/branch/ConfirmationModal.jsx`

**Props:**
- `isOpen`: boolean - Whether modal is visible
- `onClose`: function - Called when modal is closed (cancel button or backdrop click)
- `onConfirm`: function - Called when primary action button is clicked
- `title`: string - Modal title (default: 'Confirm Action')
- `description`: string - Modal body text (default: 'Are you sure you want to proceed?')
- `confirmText`: string - Primary button text (default: 'Confirm')
- `cancelText`: string - Secondary button text (default: 'Cancel')
- `isDangerous`: boolean - Whether to use destructive styling (red) (default: false)
- `isLoading`: boolean - Show loading spinner in primary button (default: false)
- `icon`: ReactNode - Custom icon component (default: AlertCircle)
- `size`: 'sm' | 'md' | 'lg' - Modal size (default: 'md')

**Styling:**
- Green theme for confirmations (`isDangerous={false}`)
- Red theme for destructive actions (`isDangerous={true}`)
- Smooth animations with fade-in and backdrop blur
- Responsive design for mobile and desktop

## Usage Examples

### Simple Confirmation
```jsx
const [modalState, setModalState] = useState({
  isOpen: false,
  title: '',
  description: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  isDangerous: false,
  onConfirm: null
});

// Show confirmation
setModalState({
  isOpen: true,
  title: 'Close Order',
  description: 'Mark this order as closed?',
  confirmText: 'Close',
  cancelText: 'Cancel',
  isDangerous: false,
  onConfirm: async () => {
    await handleCloseOrder();
    setModalState({ ...modalState, isOpen: false });
  }
});

// Render modal
<ConfirmationModal
  isOpen={modalState.isOpen}
  onClose={() => setModalState({ ...modalState, isOpen: false })}
  onConfirm={modalState.onConfirm}
  title={modalState.title}
  description={modalState.description}
  confirmText={modalState.confirmText}
  cancelText={modalState.cancelText}
  isDangerous={modalState.isDangerous}
  isLoading={modalState.isLoading}
/>
```

### Destructive Action (Delete)
```jsx
const handleDelete = async (id) => {
  setModalState({
    isOpen: true,
    title: 'Delete Item',
    description: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    isDangerous: true, // Red styling
    onConfirm: async () => {
      try {
        await axios.delete(`${API_URL}/api/items/${id}`);
        setModalState({ ...modalState, isOpen: false });
      } catch (error) {
        // Handle error with error modal
        setModalState({
          isOpen: true,
          title: 'Error',
          description: error.message,
          isDangerous: true,
          onConfirm: null
        });
      }
    }
  });
};
```

### Error Message (Info Only)
```jsx
setModalState({
  isOpen: true,
  title: 'Error',
  description: 'Failed to save changes',
  confirmText: 'OK',
  isDangerous: true,
  onConfirm: null // No action, just dismiss
});
```

## Implementation in Files

### Orders.jsx
**Modals Added:**
- **Payment Confirmation**: Confirms payment before processing
- **Close Order**: Confirms closing a paid order
- **Error Messages**: Various API failures
- **Success Messages**: Bill sent, order updated

**Key Functions Updated:**
- `handleCheckout()`: Payment confirmation
- `handleCloseOrder()`: Order closure
- `handleSendBill()`: WhatsApp bill sending

### Tables.jsx
**Modals Added:**
- **Delete Table**: Confirmation to delete table
- **Change Status**: Mark table as maintenance/occupied/available
- **Error Messages**: Save/delete failures

**Key Functions Updated:**
- `handleDelete()`: Table deletion
- `handleStatusChange()`: Table status changes
- `handleSubmit()`: Form submission errors

### Inventory.jsx
**Modals Added:**
- **Delete Item**: Confirmation to delete menu item
- **Delete Category**: Confirmation to delete category
- **Duplicate Item**: Error handling
- **Bulk Actions**: Confirm bulk operations (delete/disable/recategorize)
- **Toggle Availability**: Disable/enable item
- **Error Messages**: Save/update failures

**Key Functions Updated:**
- `handleDelete()`: Menu item deletion
- `handleDeleteCategory()`: Category deletion
- `handleDuplicate()`: Item duplication
- `handleSubmit()`: Item save/edit
- `handleToggleAvailability()`: Item status toggle
- `handleBulkAction()`: Bulk operations
- `handleSaveCategory()`: Category save

## Visual Design

### Color Schemes
**Confirmation (Green)**
- Background: Green with opacity
- Icon: Green (CheckCircle or AlertCircle)
- Primary button: bg-green-600 hover:bg-green-700

**Destructive (Red)**
- Background: Red with opacity
- Icon: Red (Trash2 or AlertCircle)
- Primary button: bg-red-600 hover:bg-red-700

### Layout
```
┌─────────────────────────────────┐
│ ┌─┐ Title            [X Close]  │ Header
├─────────────────────────────────┤
│                                 │
│ Description text                │ Body
│                                 │
├─────────────────────────────────┤
│            [Cancel]  [Confirm]  │ Footer
└─────────────────────────────────┘
```

## Accessibility Features

- **ARIA Labels**: 
  - `role="alertdialog"`
  - `aria-modal="true"`
  - `aria-labelledby` and `aria-describedby`

- **Keyboard Navigation**:
  - Tab focuses primary and secondary buttons
  - Enter/Space triggers focused button
  - Escape can close modal via backdrop

- **Focus Management**:
  - Focus trapped in modal
  - Initial focus on primary action
  - Focus restored to trigger element on close

## Best Practices

1. **Always provide a title**: Clearly state what action is being confirmed
2. **Use specific descriptions**: Explain consequences ("This cannot be undone")
3. **Use destructive styling for dangerous operations**: Red background for delete/disable
4. **Keep descriptions concise**: Under 2 sentences when possible
5. **Never nest modals**: Use callback pattern to show sequential modals
6. **Include async handling**: Show loading state during API calls
7. **Handle errors gracefully**: Show error modal if confirmation fails

## Migration Checklist

✅ Orders.jsx - All alerts/confirms replaced
✅ Tables.jsx - All alerts/confirms replaced
✅ Inventory.jsx - All alerts/confirms replaced
✅ ConfirmationModal component created
✅ Icon imports added to all files
✅ State management for modal added to all files

## Future Enhancements

- [ ] Keyboard shortcut support (Ctrl+Y to confirm, Ctrl+N to cancel)
- [ ] Animation customization (different entrance animations)
- [ ] Custom timeout for auto-dismiss messages
- [ ] History/undo support for reversible actions
- [ ] Modal queueing for sequential confirmations
- [ ] Internationalization (i18n) support

## Testing Recommendations

1. **Functional Testing**:
   - Modal appears when triggered
   - Primary action executes
   - Cancel button closes modal
   - Backdrop click closes modal
   - Error modals display correctly

2. **Accessibility Testing**:
   - Tab navigation through buttons
   - Escape key closes modal
   - Screen reader announces modal
   - Focus management works correctly

3. **UX Testing**:
   - Timing feels natural (no lag)
   - Colors clear for dangerous operations
   - Text is readable and clear
   - Mobile responsive

## Common Pitfalls to Avoid

- ❌ Forgetting to close modal after action
- ❌ Showing two modals simultaneously
- ❌ Not providing enough context in description
- ❌ Using isDangerous=true for non-destructive actions
- ❌ Blocking interaction while loading without showing spinner

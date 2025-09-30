// Show quantity popup with number pad
function showQuantityPopup(row = null) {
    // Determine which row to update
    if (!row) {
        // Find the last row with an item code (not empty)
        const rows = itemsTableBody.querySelectorAll('tr');
        let lastRowWithItem = null;
        
        // Search from the end to find the last row with an item code
        for (let i = rows.length - 1; i >= 0; i--) {
            const itemCodeEl = rows[i].querySelector('.item-code');
            if (itemCodeEl && itemCodeEl.value && itemCodeEl.value.trim() !== '') {
                lastRowWithItem = rows[i];
                break;
            }
        }
        
        if (lastRowWithItem) {
            currentRowForQuantity = lastRowWithItem;
        } else {
            // If no rows with items found, add a new one
            addNewRow();
            const newRows = itemsTableBody.querySelectorAll('tr');
            currentRowForQuantity = newRows[newRows.length - 1];
        }
    } else {
        currentRowForQuantity = row;
    }
    
    // Get current quantity value
    const currentQty = currentRowForQuantity.querySelector('.item-qty').value;
    quantityDisplay.textContent = '0';
    
    // Show popup and overlay
    quantityPopup.classList.add('active');
    quantityPopupOverlay.classList.add('active');
}

// Hide quantity popup
function hideQuantityPopup() {
    quantityPopup.classList.remove('active');
    quantityPopupOverlay.classList.remove('active');
    currentRowForQuantity = null;
}

// Apply quantity from popup
function applyQuantityFromPopup() {
    if (!currentRowForQuantity) return;
    
    const qtyValue = parseFloat(quantityDisplay.textContent);
    if (isNaN(qtyValue) || qtyValue <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }
    
    // Update the quantity in the row
    const qtyInput = currentRowForQuantity.querySelector('.item-qty');
    qtyInput.value = qtyValue;
    
    // Trigger change event to update amount
    const event = new Event('change', { bubbles: true });
    qtyInput.dispatchEvent(event);
    
    // Hide the popup
    hideQuantityPopup();
    
    // Focus back on the quantity field
    qtyInput.focus();
    qtyInput.select();
}

// Handle number pad button clicks
function handleNumpadInput(value) {
    let currentValue = quantityDisplay.textContent;
    
    if (value === 'clear') {
        quantityDisplay.textContent = '0';
    } else if (value === 'backspace') {
        if (currentValue.length > 1) {
            quantityDisplay.textContent = currentValue.slice(0, -1);
        } else {
            quantityDisplay.textContent = '0';
        }
    } else {
        // Regular number input
        if (currentValue === '0') {
            quantityDisplay.textContent = value;
        } else {
            quantityDisplay.textContent += value;
        }
    }
}
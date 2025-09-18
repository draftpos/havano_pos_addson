// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.ha-toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `ha-toast ha-toast-${type}`;
    toast.innerHTML = `
        <div class="ha-toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div class="ha-toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Show quantity popup with number pad
function showQuantityPopup(row = null) {
    // Determine which row to update
    if (!row) {
        // If no row specified, try to find the active row
        const activeRow = document.querySelector('.item-row-active');
        if (activeRow) {
            currentRowForQuantity = activeRow;
        } else {
            // If no active row, use the row with the focused input
            const focusedInput = document.activeElement;
            if (focusedInput && focusedInput.closest('tr')) {
                currentRowForQuantity = focusedInput.closest('tr');
            } else {
                // If no focused input, use the last row with items
                const rows = itemsTableBody.querySelectorAll('tr');
                if (rows.length > 0) {
                    currentRowForQuantity = rows[rows.length - 1];
                } else {
                    // If no rows, add a new one
                    addNewRow();
                    const newRows = itemsTableBody.querySelectorAll('tr');
                    currentRowForQuantity = newRows[newRows.length - 1];
                }
            }
        }
    } else {
        currentRowForQuantity = row;
    }
    
    // Get current quantity value
    const currentQty = currentRowForQuantity.querySelector('.item-qty').value;
    // quantityDisplay.textContent = currentQty || '1';
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
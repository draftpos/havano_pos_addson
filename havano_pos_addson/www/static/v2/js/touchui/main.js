// Initialize the POS when DOM is loaded
document.addEventListener('DOMContentLoaded', initPOS);

function initPOS() {
    cacheDOM();
    bindEvents();
    loadInitialData();
    addNewRow(); // Add first row
    showToast('POS System Ready', 'success');
    
    // Set initial focus to customer field
    setTimeout(() => {
        customerSelect.focus();
        const fields = getFocusableFields();
        currentFocusIndex = fields.indexOf(customerSelect);
    }, 100);
}

// Add new row function
function addNewRow() {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="ha-relative">
            <input type="text" class="item-code form-control ha-item-input" placeholder="Type item code">
        </td>
        <td>
            <input type="text" class="item-name form-control ha-item-input" placeholder="Click to see all items">
        </td>
        <td>
            <input type="text" class="item-uom form-control" value="Nos" readonly>
        </td>
        <td>
            <input type="number" class="item-qty form-control" value="1" min="1">
        </td>
        <td>
            <input type="number" class="item-rate form-control" value="0.00" step="0.01">
        </td>
        <td>
            <input type="text" class="item-amount form-control" value="0.00" readonly>
        </td>
        <td class="text-center">
            <button class="btn btn-sm btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    itemsTableBody.appendChild(newRow);
    
    // Auto-focus on the new item code field
    setTimeout(() => {
        const itemCodeInput = newRow.querySelector('.item-code');
        itemCodeInput.focus();
        itemCodeInput.select();
        
        // Update current focus index
        const fields = getFocusableFields();
        currentFocusIndex = fields.indexOf(itemCodeInput);
    }, 100);
}

// Update item amount
function updateItemAmount(input) {
    const row = input.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amountCell = row.querySelector('.item-amount');
    
    const amount = qty * rate;
    amountCell.value = amount.toFixed(2);
    
    updateTotals();
}

// Remove item
function removeItem(button) {
    if (itemsTableBody.querySelectorAll('tr').length > 1) {
        button.closest('tr').remove();
        updateTotals();
    } else {
        showToast('You must have at least one item row.', 'error');
    }
}

// Update totals
function updateTotals() {
    let total = 0;
    const amountCells = document.querySelectorAll('.item-amount');
    
    amountCells.forEach(cell => {
        total += parseFloat(cell.value) || 0;
    });
    
    totalAmount.textContent = `$${total.toFixed(2)}`;
    subTotal.value = total.toFixed(2);
}

// Handle function keys
function handleFunctionKey(action) {
    const actions = {
        payment: () => saveSalesInvoice(),
        quantity: () => showQuantityPopup(),
        discount: () => showToast('Discount feature coming soon', 'success'),
        options: () => showToast('Options menu coming soon', 'success'),
        return: () => showToast('Return process coming soon', 'success')
    };
    
    if (actions[action]) actions[action]();
}

function showPaymentDialog(){
    const subTotalEl = document.getElementById('sub_total').value;
    if (subTotalEl == 0) {
        showHaPopupCustom('Select at least one Item')
        return
    }
    openPaymentPopup();
  
}

// Adjust main styles
function adjustMainStyles() {
    const mainElement = document.querySelector('main.container.my-4');
    if (mainElement) {
        // Replace class 'container' with 'container-fluid'
        mainElement.classList.replace('container', 'container-fluid');

        // Set styles
        mainElement.style.setProperty('margin', '0', 'important');
        mainElement.style.setProperty('padding', '0', 'important');
        mainElement.style.setProperty('width', '100%', 'important');
    }
}

// Make save function globally available for testing
window.saveSalesInvoice = saveSalesInvoice;

// Run when window loads
window.onload = function() {
    adjustMainStyles();
};
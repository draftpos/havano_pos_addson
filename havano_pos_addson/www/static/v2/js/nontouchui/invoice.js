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

// Save sales invoice
function saveSalesInvoice() {
    // Validate required fields
    if (!customerSelect.value) {
        showToast('Please select a customer', 'error');
        customerSelect.focus();
        return;
    }
    
    // Collect items data
    const items = [];
    const rows = itemsTableBody.querySelectorAll('tr');
    let hasItems = false;
    
    rows.forEach(row => {
        const itemCode = row.querySelector('.item-code').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        
        if (itemCode && qty && rate) {
            hasItems = true;
            items.push({
                item_code: itemCode,
                qty: qty,
                rate: rate
            });
        }
    });
    
    if (!hasItems) {
        showToast('Please add at least one item', 'error');
        const firstItemCode = itemsTableBody.querySelector('.item-code');
        if (firstItemCode) firstItemCode.focus();
        return;
    }
    
    // showLoading();
    
    // Create sales invoice
    frappe.call({
        method: "havano_pos_addson.havano_pos_addson.doctype.ha_pos_invoice.ha_pos_invoice.create_sales_invoice",
        args: {
            customer: customerSelect.value,
            items: items,
            price_list: priceListSelect.value || undefined
        },
        callback: function(response) {
            hideLoading();
            if (response.message) {
                showToast('Sales Invoice created successfully!', 'success');
                
                // Reset form
                itemsTableBody.innerHTML = '';
                addNewRow();
                updateTotals();
            }
        },
        error: function(err) {
            hideLoading();
            showToast('Error creating sales invoice: ' + (err.message || 'Unknown error'), 'error');
        }
    });
}
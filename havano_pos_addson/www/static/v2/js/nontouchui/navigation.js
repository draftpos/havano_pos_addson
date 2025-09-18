// Navigate search results with arrow keys
function navigateSearchResults(direction) {
    const results = searchDropdown.querySelectorAll('.ha-search-result-item');
    if (results.length === 0) return;
    
    let currentActive = searchDropdown.querySelector('.ha-search-result-active');
    let index = 0;
    
    if (currentActive) {
        index = Array.from(results).indexOf(currentActive);
        currentActive.classList.remove('ha-search-result-active');
        index = (index + direction + results.length) % results.length;
    } else {
        // If no active item, set first item as active
        index = 0;
    }
    
    results[index].classList.add('ha-search-result-active');
    results[index].scrollIntoView({ block: 'nearest' });
}

// Navigate between table rows with arrow keys
function navigateTableRows(direction) {
    const rows = itemsTableBody.querySelectorAll('tr');
    if (rows.length === 0) return;
    
    const currentRow = document.activeElement.closest('tr');
    let index = Array.from(rows).indexOf(currentRow);
    
    if (index !== -1) {
        index = (index + direction + rows.length) % rows.length;
        const nextRow = rows[index];
        
        // Find the same type of input in the next row
        const currentInputType = document.activeElement.className.split(' ')[0];
        const nextInput = nextRow.querySelector('.' + currentInputType);
        
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
            
            // Update current focus index
            const fields = getFocusableFields();
            currentFocusIndex = fields.indexOf(nextInput);
            
            // Scroll the row into view
            nextRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
}

// Get all focusable fields in order
function getFocusableFields() {
    const fields = [];
    
    // Customer and price list fields
    fields.push(customerSelect);
    fields.push(priceListSelect);
    
    // Item rows fields
    const rows = itemsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        fields.push(row.querySelector('.item-code'));
        fields.push(row.querySelector('.item-rate'));
        fields.push(row.querySelector('.item-qty'));
    });
    
    // Filter out null values
    return fields.filter(field => field !== null);
}

// Move to next focusable field
function moveToNextField() {
    const fields = getFocusableFields();
    currentFocusIndex = (currentFocusIndex + 1) % fields.length;
    fields[currentFocusIndex].focus();
    
    // Select text if it's an input field
    if (fields[currentFocusIndex].tagName === 'INPUT') {
        fields[currentFocusIndex].select();
    }
}

// Move to previous focusable field
function moveToPreviousField() {
    const fields = getFocusableFields();
    currentFocusIndex = (currentFocusIndex - 1 + fields.length) % fields.length;
    fields[currentFocusIndex].focus();
    
    // Select text if it's an input field
    if (fields[currentFocusIndex].tagName === 'INPUT') {
        fields[currentFocusIndex].select();
    }
}
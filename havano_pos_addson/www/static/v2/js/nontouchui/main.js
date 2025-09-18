// Global variables
let allItems = [];
let allSettings = [];
let allCustomers = [];
let allPriceLists = [];
let activeItemField = null;
let currentFocusIndex = -1;
let isInSearchMode = false;
let currentSearchTerm = '';
let currentSearchResults = [];
let currentRowForQuantity = null;

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
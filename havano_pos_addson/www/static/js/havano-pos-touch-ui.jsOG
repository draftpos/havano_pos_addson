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
let itemGroups = [];
let currentItemGroup = null;

// DOM elements
const itemsTableBody = document.getElementById('itemsTableBody');
const totalAmount = document.getElementById('totalAmount');
const subTotal = document.getElementById('sub_total');
const btnAddRow = document.getElementById('btnAddRow');
const searchDropdown = document.getElementById('searchDropdown');
const customerSelect = document.getElementById('customer');
const priceListSelect = document.getElementById('pricelist');
const btnPayment = document.getElementById('btnPayment');
const loadingOverlay = document.getElementById('loadingOverlay');
const quantityPopup = document.getElementById('quantityPopup');
const quantityPopupOverlay = document.getElementById('quantityPopupOverlay');
const quantityDisplay = document.getElementById('quantityDisplay');
const quantityPopupConfirm = document.getElementById('quantityPopupConfirm');
const quantityPopupCancel = document.getElementById('quantityPopupCancel');
const quantityClear = document.getElementById('quantityClear');
const quantityBackspace = document.getElementById('quantityBackspace');
const itemGroupsContainer = document.getElementById('itemGroupsContainer');
const groupItemsContainer = document.getElementById('groupItemsContainer');
const quantityDisplaySidebar = document.getElementById('quantityDisplaySidebar');
const quantitySidebarConfirm = document.getElementById('quantitySidebarConfirm');
const quantitySidebarCancel = document.getElementById('quantitySidebarCancel');
const quantitySidebarClear = document.getElementById('quantitySidebarClear');
const quantitySidebarBackspace = document.getElementById('quantitySidebarBackspace');

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

// Cache DOM elements
function cacheDOM() {
    // Already defined above
}

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
    // quantityDisplay.textContent = currentQty || '0';
    quantityDisplay.textContent = '0';
    // quantityDisplaySidebar.textContent = currentQty || '1';
    
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

// Bind event listeners
function bindEvents() {
    btnAddRow.addEventListener('click', addNewRow);
    btnPayment.addEventListener('click', showPaymentDialog);
    // btnPayment.addEventListener('click', saveSalesInvoice);
    
    // Quantity popup events
    quantityPopupConfirm.addEventListener('click', applyQuantityFromPopup);
    quantityPopupCancel.addEventListener('click', hideQuantityPopup);
    quantityPopupOverlay.addEventListener('click', hideQuantityPopup);
    
    // Sidebar quantity events
    // quantitySidebarConfirm.addEventListener('click', applyQuantityFromPopup);
    // quantitySidebarCancel.addEventListener('click', hideQuantityPopup);
    
    // Number pad events
    document.querySelectorAll('.ha-numpad-btn[data-value]').forEach(button => {
        button.addEventListener('click', () => {
            handleNumpadInput(button.getAttribute('data-value'));
        });
    });
    
    document.querySelectorAll('.ha-sidebar-numpad-btn[data-value]').forEach(button => {
        button.addEventListener('click', () => {
            handleNumpadInput(button.getAttribute('data-value'));
        });
    });
    
    quantityClear.addEventListener('click', () => {
        handleNumpadInput('clear');
    });
    
    // quantitySidebarClear.addEventListener('click', () => {
    //     handleNumpadInput('clear');
    // });
    
    quantityBackspace.addEventListener('click', () => {
        handleNumpadInput('backspace');
    });
    
    // quantitySidebarBackspace.addEventListener('click', () => {
    //     handleNumpadInput('backspace');
    // });
    
    // Handle Enter key in quantity popup
    document.addEventListener('keydown', function(e) {
        if (quantityPopup.classList.contains('active')) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyQuantityFromPopup();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideQuantityPopup();
            } else if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                handleNumpadInput(e.key);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                handleNumpadInput('backspace');
            } else if (e.key === 'Delete' || e.key === 'Clear') {
                e.preventDefault();
                handleNumpadInput('clear');
            }
        }
    });
    
    // Event delegation for dynamic elements
    document.addEventListener('click', function(e) {
        // Item search for both name and code
        if (e.target.classList.contains('ha-item-input') || 
            e.target.classList.contains('item-code')) {
            showItemSearchDropdown(e.target);
            activeItemField = e.target;
        } 
        // Delete item
        else if (e.target.closest('.btn-danger')) {
            removeItem(e.target.closest('.btn-danger'));
        }
        // Hide dropdown when clicking elsewhere
        else if (!e.target.closest('.ha-item-search-dropdown')) {
            searchDropdown.style.display = 'none';
            isInSearchMode = false;
        }
        
        // Function keys
        if (e.target.closest('.ha-function-key')) {
            const action = e.target.closest('.ha-function-key').dataset.action;
            handleFunctionKey(action);
        }
        
        // Set active row when clicking on any row element
        if (e.target.closest('tr')) {
            const rows = itemsTableBody.querySelectorAll('tr');
            rows.forEach(row => row.classList.remove('item-row-active'));
            e.target.closest('tr').classList.add('item-row-active');
        }
    });
    
    // Input events for both item code and name search
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-code') || 
            e.target.classList.contains('ha-item-input')) {
            const searchTerm = e.target.value.trim();
            currentSearchTerm = searchTerm;
            
            if (searchTerm.length > 1) {
                searchItems(searchTerm, e.target.classList.contains('item-code') ? 'code' : 'name');
                positionDropdown(e.target);
            } else {
                searchDropdown.style.display = 'none';
                isInSearchMode = false;
            }
        }
    });
    
    // Change events for quantity and rate
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('item-qty') || 
            e.target.classList.contains('item-rate')) {
            updateItemAmount(e.target);
        }
    });
    
    // Focus events for form fields
    document.addEventListener('focusin', function(e) {
        if (e.target.matches('input, select')) {
            // Remove active class from all fields
            document.querySelectorAll('input, select').forEach(field => {
                field.classList.remove('form-field-active');
            });
            
            // Add active class to current field
            e.target.classList.add('form-field-active');
            
            // Update current focus index
            const fields = getFocusableFields();
            currentFocusIndex = fields.indexOf(e.target);
            
            // If it's an item field, set as active
            if (e.target.classList.contains('ha-item-input') || 
                e.target.classList.contains('item-code')) {
                activeItemField = e.target;
            }
            
            // Set active row when focusing on a field in a row
            if (e.target.closest('tr')) {
                const rows = itemsTableBody.querySelectorAll('tr');
                rows.forEach(row => row.classList.remove('item-row-active'));
                e.target.closest('tr').classList.add('item-row-active');
            }
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Skip if quantity popup is active (handled separately)
        if (quantityPopup.classList.contains('active')) return;
        
        // Function keys
        if (e.key === 'F1' || e.key === 'F2') {
            e.preventDefault();
            showPaymentDialog();
            // saveSalesInvoice();
        }
        else if (e.key === 'F5') {
            e.preventDefault();
            handleFunctionKey('quantity');
        }
        else if (e.key === 'F7') handleFunctionKey('discount');
        else if (e.key === 'F10') handleFunctionKey('options');
        else if (e.key === 'F12') handleFunctionKey('return');
        
        // Enter key to move to next field/row or confirm selection
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            
            // Handle Enter in search dropdown
            if (searchDropdown.style.display === 'block') {
                e.preventDefault();
                const activeResult = searchDropdown.querySelector('.ha-search-result-active');
                if (activeResult) {
                    activeResult.click();
                    searchDropdown.style.display = 'none';
                    isInSearchMode = false;

                    if (allSettings.length > 0 && allSettings[0].ha_on_pres_enter === "nextrow") {
                        addNewRow();
                    } else {
                        moveToNextField();
                    }
                }
            }
            // Handle Enter in item code field - FIRST ENTER SHOWS SEARCH
            else if (activeElement.classList.contains('item-code')) {
                e.preventDefault();
                const row = activeElement.closest('tr');
                const code = activeElement.value.trim();
                currentSearchTerm = code;
                
                if (code) {
                    // If we're already in search mode, select the first result
                    if (isInSearchMode) {
                        const firstResult = searchDropdown.querySelector('.ha-search-result-item');
                        if (firstResult) {
                            firstResult.click();
                            searchDropdown.style.display = 'none';
                            isInSearchMode = false;
                            
                            // Move to rate field after selection
                            row.querySelector('.item-rate').focus();
                            row.querySelector('.item-rate').select();
                        }
                    } else {
                        // First Enter - show search results
                        showItemSearchDropdown(activeElement);
                        searchItems(code, 'code');
                        isInSearchMode = true;
                    }
                } else {
                    // If empty, show all items
                    showItemSearchDropdown(activeElement);
                    displaySearchResults(allItems.slice(0, 10));
                    isInSearchMode = true;
                }
            }
            // Handle Enter in item name field - FIRST ENTER SHOWS SEARCH
            else if (activeElement.classList.contains('ha-item-input') && 
                     !activeElement.classList.contains('item-code')) {
                e.preventDefault();
                const row = activeElement.closest('tr');
                const name = activeElement.value.trim();
                currentSearchTerm = name;
                
                if (isInSearchMode) {
                    // Second Enter - select first result
                    const firstResult = searchDropdown.querySelector('.ha-search-result-item');
                    if (firstResult) {
                        firstResult.click();
                        searchDropdown.style.display = 'none';
                        isInSearchMode = false;
                        
                        // Move to rate field after selection
                        row.querySelector('.item-rate').focus();
                        row.querySelector('.item-rate').select();
                    }
                } else {
                    // First Enter - show search results
                    showItemSearchDropdown(activeElement);
                    searchItems(name, 'name');
                    isInSearchMode = true;
                }
            }
            // Handle Enter in rate field
            else if (activeElement.classList.contains('item-rate')) {
                e.preventDefault();
                const row = activeElement.closest('tr');
                row.querySelector('.item-qty').focus();
                row.querySelector('.item-qty').select();
            }
            // Handle Enter in quantity field
            else if (activeElement.classList.contains('item-qty')) {
                e.preventDefault();
                
                const row = activeElement.closest('tr');
                const nextRow = row.nextElementSibling;
                
                if (nextRow) {
                    nextRow.querySelector('.item-code').focus();
                    nextRow.querySelector('.item-code').select();
                } else {
                    // If no next row, add new row and focus on item code
                    addNewRow();
                    const newRow = itemsTableBody.lastChild;
                    newRow.querySelector('.item-code').focus();
                    newRow.querySelector('.item-code').select();
                }
            }
            // Handle Enter in customer or price list fields
            else if (activeElement === customerSelect || activeElement === priceListSelect) {
                e.preventDefault();
                moveToNextField();
            }
        }
        
        // Tab key to move to next field
        if (e.key === 'Tab') {
            e.preventDefault();
            moveToNextField();
        }
        
        // Shift+Tab to move to previous field
        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            moveToPreviousField();
        }
        
        // Escape key to close dropdown and exit search mode
        if (e.key === 'Escape') {
            searchDropdown.style.display = 'none';
            isInSearchMode = false;
            
            // If we were in an item field, keep focus there
            if (activeItemField) {
                activeItemField.focus();
                activeItemField.select();
            }
        }
        
        // Arrow keys in search dropdown
        if (searchDropdown.style.display === 'block') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateSearchResults(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateSearchResults(-1);
            }
        }
        // Arrow keys to navigate between items in the table
        else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && 
                 document.activeElement.closest('tr') && 
                 !document.activeElement.classList.contains('btn-danger')) {
            e.preventDefault();
            navigateTableRows(e.key === 'ArrowDown' ? 1 : -1);
        }
    });
    
    // Logout button
    document.getElementById('btnLogout').addEventListener('click', function() {
        window.location.href = '/logout';
    });
    
    // Handle window resize to reposition dropdown
    window.addEventListener('resize', function() {
        if (searchDropdown.style.display === 'block' && activeItemField) {
            positionDropdown(activeItemField);
        }
    });
}

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

// Load customers
function loadCustomers(callback) {
    customerSelect.innerHTML = '<option value="">Select Customer</option>';
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Customer",
            fields: ["name", "customer_name"],
            limit: 100
        },
        callback: function(response) {
            if (response.message) {
                allCustomers = response.message;
                allCustomers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.name;
                    option.textContent = customer.customer_name || customer.name;
                    customerSelect.appendChild(option);
                });
                if (callback) callback();
            } else {
                showToast('Failed to load customers', 'error');
                if (callback) callback();
            }
        },
        error: function(error) {
            showToast('Error loading customers', 'error');
            if (callback) callback();
        }
    });
}

// Load price lists
function loadPriceLists(callback) {
    priceListSelect.innerHTML = '<option value="">Select Price List</option>';
    
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Price List",
            fields: ["name", "price_list_name"],
            filters: { enabled: 1 }
        },
        callback: function(response) {
            if (response.message) {
                allPriceLists = response.message;
                allPriceLists.forEach(priceList => {
                    const option = document.createElement('option');
                    option.value = priceList.name;
                    option.textContent = priceList.price_list_name || priceList.name;
                    priceListSelect.appendChild(option);
                });
                if (callback) callback();
            } else {
                showToast('Failed to load price lists', 'error');
                if (callback) callback();
            }
        },
        error: function(error) {
            showToast('Error loading price lists', 'error');
            if (callback) callback();
        }
    });
}

// Load all items
function loadAllItems(callback) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Item",
            fields: ["name", "item_name", "description", "stock_uom", "valuation_rate"],
            limit: 1000
        },
        callback: function(response) {
            if (response.message) {
                allItems = response.message;
                if (callback) callback();
            } else {
                showToast('Failed to load items', 'error');
                if (callback) callback();
            }
        },
        error: function(error) {
            showToast('Error loading items', 'error');
            if (callback) callback();
        }
    });
}

// Load item groups
function loadItemGroups(callback) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Item Group",
            fields: ["name", "item_group_name"],
            limit: 100
        },
        callback: function(response) {
            if (response.message) {
                itemGroups = response.message;
                displayItemGroups(itemGroups.slice(0, 8)); // Show first 8 groups
                if (callback) callback();
            } else {
                showToast('Failed to load item groups', 'error');
                if (callback) callback();
            }
        },
        error: function(error) {
            showToast('Error loading item groups', 'error');
            if (callback) callback();
        }
    });
}

// Display item groups
function displayItemGroups(groups) {
    itemGroupsContainer.innerHTML = '';
    // itemGroupsContainer.style.backgroundColor = "blue";
    
    groups.forEach(group => {
        const groupBtn = document.createElement('button');
        groupBtn.className = 'ha-item-group-btn';
        groupBtn.textContent = group.item_group_name || group.name;
        groupBtn.dataset.groupName = group.name;
        
        groupBtn.addEventListener('click', () => {
            // Set active group
            document.querySelectorAll('.ha-item-group-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            groupBtn.classList.add('active');
            
            // Load items for this group
            currentItemGroup = group.name;
            loadItemsByGroup(group.name);
        });
        
        itemGroupsContainer.appendChild(groupBtn);
    });
    
    // Add "More" button if there are more than 8 groups
    if (itemGroups.length > 8) {
        const moreBtn = document.createElement('button');
        moreBtn.className = 'ha-item-group-btn';
        moreBtn.textContent = 'More...';
        moreBtn.addEventListener('click', () => {
            displayItemGroups(itemGroups); // Show all groups
        });
        itemGroupsContainer.appendChild(moreBtn);
    }
}

// Load items by group
function loadItemsByGroup(groupName) {
    showLoading();
    
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Item",
            fields: ["name", "item_name", "description", "stock_uom", "valuation_rate"],
            filters: { item_group: groupName },
            limit: 100
        },
        callback: function(response) {
            hideLoading();
            if (response.message) {
                displayGroupItems(response.message);
            } else {
                showToast('Failed to load items for this group', 'error');
            }
        },
        error: function(error) {
            hideLoading();
            showToast('Error loading items for this group', 'error');
        }
    });
}












// Display items in the group
function displayGroupItems(items) {
    groupItemsContainer.innerHTML = '';
    
    if (items.length === 0) {
        groupItemsContainer.innerHTML = '<div class="text-center" style="grid-column: 1 / -1; padding: 20px;">No items found in this group</div>';
        return;
    }
    
    items.forEach(item => {
        const itemBtn = document.createElement('div');
        itemBtn.className = 'ha-group-item-btn';
        // itemBtn.innerHTML = `
        //     <span class="ha-item-code-small">${item.name}</span>
        //     <span class="ha-item-name-small">${item.item_name || item.name}</span>
        //     <span class="ha-item-price-small">$${(item.valuation_rate || 0).toFixed(2)}</span>
        // `;

            itemBtn.innerHTML = `
            <span class="ha-item-code-small">${item.item_name}</span>
        `;
            
        itemBtn.addEventListener('click', () => {
            // Add this item to the items table
            addItemToTable(item);
            addNewRow();
        });
        
        groupItemsContainer.appendChild(itemBtn);
    });
}

// Add item to the items table
function addItemToTable(item) {
    // Check if we have an active row or need to create a new one
    let targetRow = document.querySelector('.item-row-active');
    
    if (!targetRow) {
        // If no active row, add a new row
        addNewRow();
        const rows = itemsTableBody.querySelectorAll('tr');
        targetRow = rows[rows.length - 1];
    }
    
    // Populate the row with item data
    targetRow.querySelector('.item-code').value = item.name;
    targetRow.querySelector('.item-name').value = item.item_name || item.name;
    targetRow.querySelector('.item-uom').value = item.stock_uom || 'Nos';
    targetRow.querySelector('.item-rate').value = (item.valuation_rate || 0).toFixed(2);
    
    // Calculate amount
    updateItemAmount(targetRow.querySelector('.item-qty'));
    
    // Focus on the quantity field
    targetRow.querySelector('.item-qty').focus();
    targetRow.querySelector('.item-qty').select();
}

// Search items with type parameter (code or name)
function searchItems(searchTerm, searchType = 'name') {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Item",
            fields: ["name", "item_name", "description", "stock_uom", "valuation_rate"],
            filters: searchType === 'code' ? 
                {"name": ["like", `%${searchTerm}%`]} :
                {"item_name": ["like", `%${searchTerm}%`]},
            limit: 20
        },
        callback: function(response) {
            if (response.message) {
                currentSearchResults = response.message;
                const itemsWithPrice = response.message.map(item => ({
                    ...item,
                    price_list_rate: item.valuation_rate,
                    actual_qty: 1
                }));
                displaySearchResults(itemsWithPrice);
            }
        }
    });
}

// Display search results
function displaySearchResults(items) {
    searchDropdown.innerHTML = '';
    
    if (items.length === 0) {
        searchDropdown.innerHTML = '<div class="ha-search-result-item">No items found</div>';
        return;
    }
    
    items.forEach((item, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'ha-search-result-item';
        if (index === 0) resultItem.classList.add('ha-search-result-active');
        resultItem.innerHTML = `
            <div>
                <span class="ha-item-code">${item.name}</span>
                <span class="ha-item-name">${item.item_name || item.name}</span>
            </div>
            <div class="ha-item-price">$${(item.valuation_rate || 0).toFixed(2)}</div>
        `;
        
        resultItem.addEventListener('click', () => {
            selectItem(item, activeItemField.closest('tr'));
            searchDropdown.style.display = 'none';
            isInSearchMode = false;
            
            // Focus on rate after selecting item
            const row = activeItemField.closest('tr');
            row.querySelector('.item-rate').focus();
            row.querySelector('.item-rate').select();
        });
        
        searchDropdown.appendChild(resultItem);
    });
}

// Position dropdown
function positionDropdown(element) {
    const rect = element.getBoundingClientRect();
    searchDropdown.style.display = 'block';
    searchDropdown.style.width = '400px';
    
    // Adjust position if near bottom of screen
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    if (spaceBelow < 300 && spaceAbove > 300) {
        // Show above the input field
        searchDropdown.style.top = (rect.top + window.scrollY - 300) + 'px';
    } else {
        // Show below the input field
        searchDropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    }
    
    searchDropdown.style.left = rect.left + 'px';
}

// Show item search dropdown
function showItemSearchDropdown(field) {
    activeItemField = field;
    positionDropdown(field);
    displaySearchResults(allItems.slice(0, 10));
}

// Select item and populate row
function selectItem(item, row) {
    row.querySelector('.item-code').value = item.name;
    row.querySelector('.item-name').value = item.item_name || item.name;
    row.querySelector('.item-uom').value = item.stock_uom || 'Nos';
    row.querySelector('.item-rate').value = (item.valuation_rate || 0).toFixed(2);
    
    // Calculate amount
    updateItemAmount(row.querySelector('.item-qty'));
    
    // Clear search mode
    isInSearchMode = false;
    currentSearchTerm = '';
}

// Add new row
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
    
    showLoading();
    
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

function loadInitialData() {
    showLoading();
    
    // First load settings, then customers and price lists
    loadPosSettings(function(settings) {
        // Store settings for later use
        allSettings = settings;
        
        // Now load customers and price lists
        loadCustomers(function() {
            loadPriceLists(function() {
                // Load item groups
                loadItemGroups(function() {
                    // Set default values after all dropdowns are populated
                    if (allSettings.length > 0) {
                        setDefaultValues(allSettings[0]);
                    }
                    
                    // Finally load items
                    loadAllItems(function() {
                        hideLoading();
                    });
                });
            });
        });
    });
}

// Load POS settings - MODIFIED to accept callback
function loadPosSettings(callback) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "HA POS Setting",
            fields: ["ha_pos_settings_on", "ha_on_pres_enter", "default_customer", "default_price_list"],
            limit: 2
        },
        callback: function(response) {
            if (response.message) {
                if (callback) callback(response.message);
            } else {
                showToast('Failed to load POS settings', 'error');
                if (callback) callback([]);
            }
        },
        error: function(error) {
            showToast('Error loading POS settings', 'error');
            if (callback) callback([]);
        }
    });
}

// Set default values from settings - MODIFIED to handle cases where options don't exist yet
function setDefaultValues(data) {
    if (!data) return;
    
    // Set default customer
    if (data.default_customer) {
        // Try to find the customer option
        const customerOption = Array.from(customerSelect.options).find(
            option => option.value === data.default_customer
        );
        
        if (customerOption) {
            customerSelect.value = data.default_customer;
        } else {
            // If customer doesn't exist in options, try to load it
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Customer",
                    name: data.default_customer
                },
                callback: function(response) {
                    if (response.message) {
                        const customer = response.message;
                        const option = document.createElement('option');
                        option.value = customer.name;
                        option.textContent = customer.customer_name || customer.name;
                        customerSelect.appendChild(option);
                        customerSelect.value = customer.name;
                    }
                }
            });
        }
    }
    
    // Set default price list
    if (data.default_price_list) {
        // Try to find the price list option
        const priceListOption = Array.from(priceListSelect.options).find(
            option => option.value === data.default_price_list
        );
        
        if (priceListOption) {
            priceListSelect.value = data.default_price_list;
        } else {
            // If price list doesn't exist in options, try to load it
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Price List",
                    name: data.default_price_list
                },
                callback: function(response) {
                    if (response.message) {
                        const priceList = response.message;
                        const option = document.createElement('option');
                        option.value = priceList.name;
                        option.textContent = priceList.price_list_name || priceList.name;
                        priceListSelect.appendChild(option);
                        priceListSelect.value = priceList.name;
                    }
                }
            });
        }
    }
}















function showPaymentDialog(){
    alert("this is a payment");
    frappe.message("Hello");
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

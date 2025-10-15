// Global variables for group filtering
let originalItemGroups = [];
let filteredItemGroups = [];
let ITEMS_PER_PAGE = 100; // Non-touch UI shows all groups at once

// Calculate items per page based on screen size
function calculateItemsPerPage() {
    // Non-touch UI typically has more screen space, keep it simple
    if (groupItemsContainer) {
        const containerWidth = groupItemsContainer.offsetWidth || window.innerWidth;
        const containerHeight = groupItemsContainer.offsetHeight || 600;
        const itemWidth = 150; // Width of each item button (updated to match CSS)
        const itemHeight = 60; // Min height of each item button (updated to match CSS)
        const padding = 20;
        const gap = 1; // Gap between items
        
        // Calculate items per row considering width and gaps
        const itemsPerRow = Math.floor((containerWidth - padding) / (itemWidth + gap));
        
        // Calculate number of rows considering height and gaps
        const availableHeight = containerHeight - 50; // Reserve space for pagination
        const rows = Math.floor(availableHeight / (itemHeight + gap));
        
        // Total items = rows × columns
        const calculatedItems = Math.max(1, itemsPerRow) * Math.max(1, rows);
        ITEMS_PER_PAGE = Math.max(20, Math.min(calculatedItems, 100));
        
        console.log(`Group Items Calculation (Non-Touch): ${itemsPerRow} cols × ${rows} rows = ${calculatedItems} items per page (using ${ITEMS_PER_PAGE})`);
    }
}

// Recalculate on window resize
window.addEventListener('resize', () => {
    calculateItemsPerPage();
});

// Load item groups
function loadItemGroups(callback) {
    frappe.call({
        method: "havano_pos_addson.api.get_item_groups",
        callback: function(response) {
            if (response.message) {
                originalItemGroups = response.message;
                itemGroups = [...originalItemGroups];
                filteredItemGroups = [...itemGroups];
                
                // Calculate items per page based on screen size
                setTimeout(() => {
                    calculateItemsPerPage();
                    displayItemGroups(itemGroups);
                    
                    // Setup search input event listener
                    setupGroupSearchListener();
                }, 100);
                
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

// Setup search input event listener
function setupGroupSearchListener() {
    const searchInput = document.getElementById('ha-group-search-input');
    if (searchInput) {
        // Add event listener for real-time search
        searchInput.addEventListener('input', function(e) {
            filterItemGroups(e.target.value);
        });
        
        // Also support Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterItemGroups(e.target.value);
            }
        });
    }
}

// Filter item groups based on search
function filterItemGroups(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        filteredItemGroups = [...originalItemGroups];
    } else {
        const search = searchTerm.toLowerCase().trim();
        filteredItemGroups = originalItemGroups.filter(group => {
            const groupName = (group.item_group_name || group.name || '').toLowerCase();
            return groupName.includes(search);
        });
    }
    
    itemGroups = [...filteredItemGroups];
    displayItemGroups(itemGroups);
}

// Display item groups
function displayItemGroups(groups) {
    itemGroupsContainer.innerHTML = '';
    
    // Create wrapper for groups (non-touch UI doesn't need pagination in same row)
    const groupsButtonsWrapper = document.createElement('div');
    groupsButtonsWrapper.className = 'ha-groups-buttons-wrapper';
    groupsButtonsWrapper.style.padding = '10px';
    
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
        
        groupsButtonsWrapper.appendChild(groupBtn);
    });
    
    itemGroupsContainer.appendChild(groupsButtonsWrapper);
}

// Load items by group using API with pagination
function loadItemsByGroup(groupName, page = 0) {
    showLoading();
    
    frappe.call({
        method: "havano_pos_addson.api.get_items_by_group",
        args: {
            item_group: groupName,
            page: page,
            page_size: ITEMS_PER_PAGE // Dynamic based on screen size
        },
        callback: function(response) {
            hideLoading();
            if (response.message && response.message.items) {
                displayGroupItems(response.message.items);
            } else if (response.message && response.message.error) {
                showToast('Error: ' + response.message.error, 'error');
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
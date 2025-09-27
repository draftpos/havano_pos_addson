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
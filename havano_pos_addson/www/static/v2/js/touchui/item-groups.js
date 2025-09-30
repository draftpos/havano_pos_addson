// Pagination variables for item groups
let currentItemGroupsPage = 0;
const ITEMS_PER_PAGE = 8;
let totalItemGroupsPages = 0;

// Pagination variables for group items
let currentGroupItemsPage = 0;
const GROUP_ITEMS_PER_PAGE = 20; // Show more items per page since they're smaller
let totalGroupItemsPages = 0;
let allGroupItems = []; // Store all items for the current group

// Load item groups
function loadItemGroups(callback) {
    // console.log('Loading item groups...');
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Item Group",
            fields: ["name", "item_group_name"],
            limit: 100
        },
        callback: function(response) {
            // console.log('Item groups response:', response);
            if (response.message) {
                itemGroups = response.message;
                totalItemGroupsPages = Math.ceil(itemGroups.length / ITEMS_PER_PAGE);
                currentItemGroupsPage = 0; // Reset to first page
                // console.log('Item groups loaded:', itemGroups.length, 'groups');
                // Ensure DOM is ready before displaying
                setTimeout(() => {
                    displayItemGroupsWithPagination();
                }, 100);
                if (callback) callback();
            } else {
                console.error('No item groups in response');
                showToast('Failed to load item groups', 'error');
                if (callback) callback();
            }
        },
        error: function(error) {
            console.error('Error loading item groups:', error);
            showToast('Error loading item groups', 'error');
            if (callback) callback();
        }
    });
}

// Display item groups with pagination
function displayItemGroupsWithPagination() {
    if (!itemGroupsContainer) {
        console.error('Item groups container not found');
        return;
    }
    
    // console.log('Displaying item groups, total groups:', itemGroups.length);
    itemGroupsContainer.innerHTML = '';
    
    // Calculate current page items
    const startIndex = currentItemGroupsPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPageGroups = itemGroups.slice(startIndex, endIndex);
    
    // console.log('Current page groups:', currentPageGroups.length);
    
    // Ensure container is visible
    if (itemGroupsContainer) {
        itemGroupsContainer.style.display = 'flex';
        itemGroupsContainer.style.visibility = 'visible';
        // console.log('Item groups container is visible');
    }
    
    // Create pagination controls container
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'ha-pagination-container';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'ha-pagination-btn ha-prev-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentItemGroupsPage === 0;
    prevBtn.addEventListener('click', () => {
        if (currentItemGroupsPage > 0) {
            currentItemGroupsPage--;
            displayItemGroupsWithPagination();
        }
    });
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'ha-page-info';
    pageInfo.textContent = `Page ${currentItemGroupsPage + 1} of ${totalItemGroupsPages}`;
    
    // Add page numbers if there are more than 3 pages
    const pageNumbersContainer = document.createElement('div');
    pageNumbersContainer.className = 'ha-page-numbers';
    
    if (totalItemGroupsPages > 3) {
        const startPage = Math.max(0, currentItemGroupsPage - 1);
        const endPage = Math.min(totalItemGroupsPages - 1, currentItemGroupsPage + 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `ha-page-number-btn ${i === currentItemGroupsPage ? 'active' : ''}`;
            pageBtn.textContent = i + 1;
            pageBtn.addEventListener('click', () => {
                currentItemGroupsPage = i;
                displayItemGroupsWithPagination();
            });
            pageNumbersContainer.appendChild(pageBtn);
        }
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'ha-pagination-btn ha-next-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentItemGroupsPage >= totalItemGroupsPages - 1;
    nextBtn.addEventListener('click', () => {
        if (currentItemGroupsPage < totalItemGroupsPages - 1) {
            currentItemGroupsPage++;
            displayItemGroupsWithPagination();
        }
    });
    
    // Add pagination controls
    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(pageInfo);
    if (totalItemGroupsPages > 3) {
        paginationContainer.appendChild(pageNumbersContainer);
    }
    paginationContainer.appendChild(nextBtn);
    itemGroupsContainer.appendChild(paginationContainer);
    
    // Display current page groups
    currentPageGroups.forEach(group => {
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
}

// Go to specific page
function goToItemGroupsPage(pageNumber) {
    if (pageNumber >= 0 && pageNumber < totalItemGroupsPages) {
        currentItemGroupsPage = pageNumber;
        displayItemGroupsWithPagination();
    }
}

// Add keyboard navigation for both item groups and group items
function addItemGroupsKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Check if we're in item groups area
        if (itemGroupsContainer && itemGroupsContainer.offsetParent !== null) {
            // Handle item groups pagination
            if (e.key === 'ArrowLeft' && currentItemGroupsPage > 0) {
                e.preventDefault();
                currentItemGroupsPage--;
                displayItemGroupsWithPagination();
            } else if (e.key === 'ArrowRight' && currentItemGroupsPage < totalItemGroupsPages - 1) {
                e.preventDefault();
                currentItemGroupsPage++;
                displayItemGroupsWithPagination();
            }
        }
        
        // Check if we're in group items area and pagination is visible
        if (groupItemsContainer && groupItemsContainer.offsetParent !== null && totalGroupItemsPages > 1) {
            // Handle group items pagination
            if (e.key === 'ArrowUp' && currentGroupItemsPage > 0) {
                e.preventDefault();
                currentGroupItemsPage--;
                displayGroupItemsWithPagination();
            } else if (e.key === 'ArrowDown' && currentGroupItemsPage < totalGroupItemsPages - 1) {
                e.preventDefault();
                currentGroupItemsPage++;
                displayGroupItemsWithPagination();
            }
        }
    });
}

// Initialize keyboard navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addItemGroupsKeyboardNavigation();
});

// Legacy function for backward compatibility
function displayItemGroups(groups) {
    displayItemGroupsWithPagination();
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
                allGroupItems = response.message; // Store all items
                totalGroupItemsPages = Math.ceil(allGroupItems.length / GROUP_ITEMS_PER_PAGE);
                currentGroupItemsPage = 0; // Reset to first page
                displayGroupItemsWithPagination();
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

// Display items in the group with pagination
function displayGroupItemsWithPagination() {
    groupItemsContainer.innerHTML = '';
    
    if (allGroupItems.length === 0) {
        groupItemsContainer.innerHTML = '<div class="text-center" style="grid-column: 1 / -1; padding: 20px;">No items found in this group</div>';
        return;
    }
    
    // Only show pagination if there are multiple pages
    if (totalGroupItemsPages > 1) {
        // Create pagination controls container
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'ha-group-items-pagination-container';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'ha-group-pagination-btn ha-group-prev-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentGroupItemsPage === 0;
        prevBtn.addEventListener('click', () => {
            if (currentGroupItemsPage > 0) {
                currentGroupItemsPage--;
                displayGroupItemsWithPagination();
            }
        });
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'ha-group-page-info';
        pageInfo.textContent = `Page ${currentGroupItemsPage + 1} of ${totalGroupItemsPages}`;
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'ha-group-pagination-btn ha-group-next-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentGroupItemsPage >= totalGroupItemsPages - 1;
        nextBtn.addEventListener('click', () => {
            if (currentGroupItemsPage < totalGroupItemsPages - 1) {
                currentGroupItemsPage++;
                displayGroupItemsWithPagination();
            }
        });
        
        // Add pagination controls
        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextBtn);
        groupItemsContainer.appendChild(paginationContainer);
    }
    
    // Calculate current page items
    const startIndex = currentGroupItemsPage * GROUP_ITEMS_PER_PAGE;
    const endIndex = startIndex + GROUP_ITEMS_PER_PAGE;
    const currentPageItems = allGroupItems.slice(startIndex, endIndex);
    
    // Display current page items
    currentPageItems.forEach(item => {
        const itemBtn = document.createElement('div');
        itemBtn.className = 'ha-group-item-btn';
        itemBtn.innerHTML = `
            <span class="ha-item-code-small item-code">${item.item_name}</span>
        `;
            
        itemBtn.addEventListener('click', () => {
            // Add this item to the items table
            const result = addItemToTable(item);
            
            // Only add new row if item was added to a new row (not just quantity increased)
            if (result === 'new_item_added') {
                addNewRow();
            }
        });
        
        groupItemsContainer.appendChild(itemBtn);
    });
}

// Go to specific page for group items
function goToGroupItemsPage(pageNumber) {
    if (pageNumber >= 0 && pageNumber < totalGroupItemsPages) {
        currentGroupItemsPage = pageNumber;
        displayGroupItemsWithPagination();
    }
}

// Legacy function for backward compatibility
function displayGroupItems(items) {
    allGroupItems = items;
    totalGroupItemsPages = Math.ceil(items.length / GROUP_ITEMS_PER_PAGE);
    currentGroupItemsPage = 0;
    displayGroupItemsWithPagination();
}

// Add item to the items table
function addItemToTable(item) {
    
    // Check if item has a valid rate
    const itemRate = parseFloat(item.valuation_rate) || 0;
    const itemDescription = item.description || '';
    const isGiftItem = itemDescription.toLowerCase().includes('gift');
    if (itemRate === 0 && isGiftItem) {
        frappe.show_alert(`Item "${item.item_name || item.name || 'Unknown Item'}" is a gift item and rate is empty.`);
    }
    if (itemRate === 0 && !isGiftItem) {
        // Show error message (only for non-gift items)
        const itemName = item.item_name || item.name || 'Unknown Item';
        frappe.msgprint(`Item "${itemName}" rate is empty. Please contact admin to add rate for this item.`);
        return false; // Return false to indicate failure
    }
    
    // Check if we have an active row or need to create a new one
    let targetRow = document.querySelector('.item-row-active');
    
    if (!targetRow) {
        // If no active row, add a new row
        addNewRow();
        const rows = itemsTableBody.querySelectorAll('tr');
        targetRow = rows[rows.length - 1];
    }
    
    // Remove empty rows above before adding the item
    removeEmptyRowsAbove(targetRow);
    
    // Populate the row with item data
    targetRow.querySelector('.item-code').value = item.name;
    targetRow.querySelector('.item-name').value = item.item_name || item.name;
    targetRow.querySelector('.item-uom').value = item.stock_uom || 'Nos';
    targetRow.querySelector('.item-rate').value = itemRate.toFixed(2);
    
    // Calculate amount
    updateItemAmount(targetRow.querySelector('.item-qty'));
    
    // Focus on the quantity field
    targetRow.querySelector('.item-qty').focus();
    targetRow.querySelector('.item-qty').select();
    
    return 'new_item_added'; // Return specific status for new item added
}
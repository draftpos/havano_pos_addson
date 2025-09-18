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
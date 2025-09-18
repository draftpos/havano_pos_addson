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

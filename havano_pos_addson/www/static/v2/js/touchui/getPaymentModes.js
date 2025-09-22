function modesOfPayments(callback) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Mode of Payment",
            fields: ["name", "mode_of_payment"],
            limit: 4
        },
        callback: function(response) {
            console.log(response.message);
            if (response.message) {
                allItems = response.message;
                localStorage.setItem("[allpaymentmethods]", JSON.stringify(allItems));
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

modesOfPayments();











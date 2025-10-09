// Save sales invoice
function saveSalesInvoice() {
    return new Promise((resolve, reject) => {
        const customerSelect = document.getElementById('customer');
        const priceListSelect = document.getElementById('pricelist');

        // Validate required fields
        if (!customerSelect.value) {
            showToast('Please select a customer', 'error');
            customerSelect.focus();
            return reject("Customer is required");
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
            return reject("No items added");
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

                    console.log("sales invoice response ----------------------");
                    console.log(response.message);

                    const invoiceNumber = response.message.name;  // ✅ THIS is what we want to return
                    //----------------------calling custom function to download the txt file-----------------
                    frappe.call({
                    method: "invoice_override_pos.sales_invoice_hooks.download_invoice_json",
                    args: { invoice_name: invoiceNumber },
                    callback: function(r) {
                        if (r.message) {
                            const blob = new Blob([JSON.stringify(r.message, null, 4)], { type: "text/plain" });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = invoiceNumber + ".txt";
                            link.click();
                        }
                        }
                    });
                    //-----------------------end of custom function call------------------
                    const invoiceDate = response.message.posting_date;
                    const currency = response.message.currency || "USD";

                    let havano_pos_shift = JSON.parse(localStorage.getItem("havano_pos_shift"));
                    let shiftNumber = null, shiftName = null;

                    if (havano_pos_shift.message && havano_pos_shift.message.length > 0) {
                        shiftNumber = havano_pos_shift.message[0].shift_number;
                        shiftName = havano_pos_shift.message[0].name;
                    }

                    // Collect payment data
                    const payments = [];
                    document.querySelectorAll(".ha-pos-payment-pop-method").forEach(methodEl => {
                        const labelEl = methodEl.querySelector(".ha-pos-payment-pop-method-label span");
                        const inputEl = methodEl.querySelector("input");
                        if (!labelEl || !inputEl) return;

                        const methodName = labelEl.textContent.trim().replace(/^\d+\s*/, ''); // remove number prefix
                        const amount = parseFloat(inputEl.value) || 0;

                        if (amount > 0) {
                            payments.push({
                                invoice_number: invoiceNumber,
                                invoice_date: invoiceDate,
                                payment_method: methodName,
                                amount: amount,
                                currency: currency,
                                shift_name: shiftName
                            });
                        }
                    });

                    // Save POS Entry records
                    frappe.call({
                        method : "havano_pos_addson.havano_pos_addson.doctype.havano_pos_entry.havano_pos_entry.save_pos_entries",
                        args: { payments: payments },
                        callback: function(r) {
                            if (r.message) {
                                console.log("POS Entries saved:", r.message.created);
                            }
                        },
                        error: function(err) {
                            console.error("Error saving POS Entries", err);
                        }
                    });

                    // Reset form
                    itemsTableBody.innerHTML = '';
                    addNewRow();
                    updateTotals();

                    // ✅ Resolve invoice name so .then() can use it
                    resolve(invoiceNumber);
                } else {
                    reject("No response message from server");
                }
            },
            error: function(err) {
                hideLoading();
                const msg = 'Error creating sales invoice: ' + (err.message || 'Unknown error');
                showToast(msg, 'error');
                reject(msg);
            }
        });
    });
}


// document.getElementById("ha-pos-savepaymentdata").addEventListener("click", saveSalesInvoice);

document.getElementById("ha-pos-savepaymentdata")
  .addEventListener("click", function () {
    saveSalesInvoice().then((invoiceName) => {
        // alert(invoiceName);
        closePaymentPopup();
    }).catch(err => {
        console.error("Failed to save invoice:", err);
    });
});

 
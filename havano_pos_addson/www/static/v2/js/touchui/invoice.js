// Save sales invoice
function saveSalesInvoice() {
    customerSelect = document.getElementById('customer');
    priceListSelect = document.getElementById('pricelist');

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
                
                // Extract invoice data from response
                console.log("sales invoice response ----------------------");
                console.log(response.message);
                const invoiceNumber = response.message.name;
                const invoiceDate = response.message.posting_date;
                const currency = response.message.currency || "USD";
                // const shiftNumber = response.message.shift_number || null;

                let havano_pos_shift = JSON.parse(localStorage.getItem("havano_pos_shift"));
                if (havano_pos_shift.message && havano_pos_shift.message.length > 0) {
                    const name = havano_pos_shift.message[0].name;
                    console.log(name); // Output: 23rv59c1tm
                    } else {
                    console.log('Name not found.');
                    return
                    }

                const shiftNumber = havano_pos_shift.message[0].shift_number;
                const shiftName  = havano_pos_shift.message[0].name;
                
                
                // ✅ Collect payment data from popup
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

                // ✅ Save Havano POS Entry records




                frappe.call({
                    method : "havano_pos_addson.havano_pos_addson.doctype.havano_pos_entry.havano_pos_entry.save_pos_entries",
                    args: {
                        payments: payments   // list of payment dicts
                    },
                    callback: function(r) {
                        if (r.message) {
                            console.log("POS Entries saved:", r.message.created);
                        }
                    },
                    error: function(err) {
                        console.error("Error saving POS Entries", err);
                    }
                });



                // payments.forEach(payment => {
                //     frappe.call({
                //         method: "frappe.client.insert",
                //         args: {
                //             doc: {
                //                 doctype: "Havano POS Entry",
                //                 invoice_number: payment.invoice_number,
                //                 invoice_date: payment.invoice_date,
                //                 payment_method: payment.payment_method,
                //                 amount: payment.amount,
                //                 currency: payment.currency,
                //                 shift_number: payment.shiftNumber
                //             }
                //         },
                //         callback: function(r) {
                //             if (r.message) {
                //                 console.log("POS Entry saved:", r.message.name);
                //             }
                //         },
                //         error: function(err) {
                //             console.error("Error saving POS Entry", err);
                //         }
                //     });
                // });
                
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


document.getElementById("ha-pos-savepaymentdata").addEventListener("click", saveSalesInvoice);
 
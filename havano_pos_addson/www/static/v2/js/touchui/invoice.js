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
                price_list: priceListSelect.value || undefined,
            },
            callback: function(response) {
                hideLoading();
                if (response && response.message) {
                    // console.log("response.message ----------------------");
                    // console.log(response.message);
                    
                    // Check if response.message has the required properties
                    if (response.message.name) {
                        frappe.show_alert(`${response.message.name} Invoice created successfully!`);

                        const invoiceNumber = response.message.name;  // ✅ THIS is what we want to return
                        const invoiceDate = response.message.posting_date;
                        const currency = response.message.currency || "USD";

                        let havano_pos_shift = JSON.parse(localStorage.getItem("havano_pos_shift"));
                        let shiftNumber = null, shiftName = null;

                        if (havano_pos_shift && havano_pos_shift.message && havano_pos_shift.message.length > 0) {
                            shiftNumber = havano_pos_shift.message[0].shift_number;
                            shiftName = havano_pos_shift.message[0].name;
                        }

                        // Collect payment data
                        const payments = [];
                        // console.log("Looking for payment elements...");
                        
                        // Try multiple selectors to find payment elements
                        const paymentSelectors = [
                            ".ha-pos-payment-pop-method",
                            ".ha-pos-payment-pop-method-input",
                            ".payment-method-row",
                            "[class*='payment']",
                            ".payment-input"
                        ];
                        
                        let paymentElements = [];
                        for (const selector of paymentSelectors) {
                            paymentElements = document.querySelectorAll(selector);
                            if (paymentElements.length > 0) {
                                // console.log(`Found payment elements with selector: ${selector}`, paymentElements.length);
                                break;
                            }
                        }
                        
                        if (paymentElements.length === 0) {
                            // console.warn("No payment elements found. Checking for alternative payment structure...");
                            
                            // Alternative approach: look for any input fields in payment popup
                            const paymentPopup = document.querySelector("#ha-pos-payment-popup, .ha-payment-popup, [id*='payment']");
                            if (paymentPopup) {
                                const inputs = paymentPopup.querySelectorAll("input[type='number'], input[type='text']");
                                // console.log("Found inputs in payment popup:", inputs.length);
                                
                                inputs.forEach((input, index) => {
                                    // Get amount from <b> element (converted amount) or input value
                                    const methodContainer = input.closest('.ha-pos-payment-pop-method');
                                    const bElement = methodContainer ? methodContainer.querySelector('.ha-pos-payment-pop-method-label b') : null;
                                    const amount = bElement ? parseFloat(bElement.textContent) || 0 : parseFloat(input.value) || 0;
                                    
                                    if (amount > 0) {
                                        // Try to find associated label or method name
                                        let methodName = `Payment Method ${index + 1}`;
                                        const label = input.closest('.form-group, .payment-row, .method-row')?.querySelector('label, .label, .method-name');
                                        if (label) {
                                            methodName = label.textContent.trim().replace(/^\d+\s*/, '');
                                        }
                                        
                                        // Get currency from input data attribute
                                        const paymentCurrency = input.getAttribute('data-currency') || currency;
                                        
                                        payments.push({
                                            invoice_number: invoiceNumber,
                                            invoice_date: invoiceDate,
                                            payment_method: methodName,
                                            amount: amount,
                                            currency: paymentCurrency,
                                            shift_name: shiftName
                                        });
                                    }
                                });
                            }
                        } else {
                            // Original logic for found payment elements
                            paymentElements.forEach(methodEl => {
                                let inputEl, labelEl, methodName;
                                
                                // Handle different element types
                                if (methodEl.classList.contains('ha-pos-payment-pop-method-input')) {
                                    // This is the input element itself
                                    inputEl = methodEl;
                                    const methodContainer = methodEl.closest('.ha-pos-payment-pop-method');
                                    if (methodContainer) {
                                        labelEl = methodContainer.querySelector(".ha-pos-payment-pop-method-label span");
                                    }
                                } else {
                                    // This is the method container
                                    inputEl = methodEl.querySelector(".ha-pos-payment-pop-method-input, input[type='text'], input[type='number']");
                                    labelEl = methodEl.querySelector(".ha-pos-payment-pop-method-label span, label, .label");
                                }
                                
                                if (!inputEl) return;
                                
                                methodName = "Unknown Payment Method";
                                if (labelEl) {
                                    // Extract method name from label (remove number prefix)
                                    methodName = labelEl.textContent.trim().replace(/^\d+\s*/, '').split('\n')[0];
                                }

                                // Get amount from <b> element (converted amount) or input value
                                const bElement = methodEl.querySelector('.ha-pos-payment-pop-method-label b');
                                const amount = bElement ? parseFloat(bElement.textContent) || 0 : parseFloat(inputEl.value) || 0;
                                
                                // Get currency from input data attribute
                                const paymentCurrency = inputEl.getAttribute('data-currency') || currency;

                                if (amount > 0) {
                                    payments.push({
                                        invoice_number: invoiceNumber,
                                        invoice_date: invoiceDate,
                                        payment_method: methodName,
                                        amount: amount,
                                        currency: paymentCurrency,
                                        shift_name: shiftName
                                    });
                                    console.log(`Added payment: ${methodName} - ${amount} ${paymentCurrency}`);
                                }
                            });
                        }
                        
                        // console.log("Collected payments:", payments);
                        
                        // If no payments found, create a default cash payment with total amount
                        if (payments.length === 0) {
                            const totalAmount = parseFloat(document.querySelector('#totalAmount')?.textContent?.replace(/[^0-9.-]/g, '') || 
                                                       document.querySelector('.ha-total-value')?.textContent?.replace(/[^0-9.-]/g, '') || 0);
                            
                            if (totalAmount > 0) {
                                payments.push({
                                    invoice_number: invoiceNumber,
                                    invoice_date: invoiceDate,
                                    payment_method: "Cash",
                                    amount: totalAmount,
                                    currency: currency,
                                    shift_name: shiftName
                                });
                                // console.log("Created default cash payment:", payments[0]);
                            }
                        }

                        // Save POS Entry records
                        if (payments.length > 0) {
                            // console.log("Saving POS Entries with payments:", payments);
                            
                            frappe.call({
                                method: "havano_pos_addson.havano_pos_addson.doctype.havano_pos_entry.havano_pos_entry.save_pos_entries",
                                args: { payments: payments },
                                callback: function(r) {
                                    // console.log("POS Entry response:", r);
                                    if (r.message) {
                                        // console.log("POS Entries saved successfully:", r.message);
                                        frappe.show_alert(`POS Entry created successfully!`);
                                    } else {
                                        // console.error("No response message from POS Entry creation");
                                        frappe.show_alert("Warning: POS Entry may not have been created", "warning");
                                    }
                                },
                                error: function(err) {
                                    // console.error("Error saving POS Entries:", err);
                                    frappe.show_alert("Error creating POS Entry: " + (err.message || "Unknown error"), "error");
                                }
                            });
                        } else {
                            // console.warn("No payments found - skipping POS Entry creation");
                            frappe.show_alert("Warning: No payment data found - POS Entry not created", "warning");
                        }

                        // Reset form
                        itemsTableBody.innerHTML = '';
                        addNewRow();
                        updateTotals();

                        // ✅ Resolve invoice name so .then() can use it
                        resolve(invoiceNumber);
                    } else {
                        // console.error("Invalid response structure:", response.message);
                        frappe.show_alert("Invoice created but with invalid response structure", "warning");
                        return reject("Invalid response structure");
                    }
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

 
// Progress Bar Helper Functions
function showProgressBar() {
    const overlay = document.getElementById('ha-pos-progress-overlay');
    const progressBar = document.getElementById('ha-pos-progress-bar');
    const progressText = document.getElementById('ha-pos-progress-text');
    
    if (overlay) {
        console.log('Showing progress bar');
        overlay.style.display = 'block';
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = 'Saving invoice...';
        
        // Disable scrolling
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Progress overlay not found');
    }
}

function updateProgress(percentage, message) {
    const progressBar = document.getElementById('ha-pos-progress-bar');
    const progressText = document.getElementById('ha-pos-progress-text');
    
    if (progressBar) progressBar.style.width = percentage + '%';
    if (progressText && message) progressText.textContent = message;
}

function hideProgressBar() {
    const overlay = document.getElementById('ha-pos-progress-overlay');
    
    if (overlay) {
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 500);
    }
}

// Print Invoice Function
function printInvoice(invoiceName) {
    console.log('printInvoice() called with:', invoiceName);
    
    return new Promise((resolve, reject) => {
        if (!invoiceName) {
            console.error('No invoice name provided to printInvoice');
            reject('No invoice name provided');
            return;
        }
        
        try {
            console.log('Updating progress to 90%');
            updateProgress(90, 'Opening print preview...');
            
            // Build the print URL
            const printUrl = `/api/method/frappe.utils.print_format.download_pdf?doctype=Sales%20Invoice&name=${encodeURIComponent(invoiceName)}&format=Standard&no_letterhead=0`;
            console.log('Print URL:', printUrl);
            
            // Open in modal iframe
            console.log('Checking for openPrintModal function:', typeof window.openPrintModal);
            if (typeof window.openPrintModal === 'function') {
                console.log('Opening print modal...');
                window.openPrintModal(printUrl);
                updateProgress(100, 'Complete!');
                
                // Small delay to ensure modal opens
                setTimeout(() => {
                    console.log('Print modal opened, resolving promise');
                    resolve(invoiceName);
                }, 500);
            } else {
                console.log('openPrintModal not available, using window.open fallback');
                // Fallback to new window if modal function not available
                const printWindow = window.open(printUrl, '_blank');
                
                if (printWindow) {
                    updateProgress(100, 'Complete!');
                    setTimeout(() => {
                        resolve(invoiceName);
                    }, 500);
                } else {
                    reject('Unable to open print preview. Please allow pop-ups.');
                }
            }
        } catch (err) {
            console.error('Print error:', err);
            reject('Error opening print preview: ' + err.message);
        }
    });
}

// Save sales invoice
function saveSalesInvoice(shouldPrint = false) {
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

        // Show progress bar instead of loading
        if (shouldPrint) {
            showProgressBar();
            updateProgress(30, 'Creating invoice...');
        } else {
            showLoading();
        }
        
        frappe.call({
            method: "havano_pos_addson.havano_pos_addson.doctype.ha_pos_invoice.ha_pos_invoice.create_sales_invoice",
            args: {
                customer: customerSelect.value,
                items: items,
                price_list: priceListSelect.value || undefined
            },
            callback: function(response) {
                if (shouldPrint) {
                    updateProgress(60, 'Processing...');
                } else {
                    hideLoading();
                }
                if (response.message) {
                    showToast('Sales Invoice created successfully!', 'success');

                    console.log("sales invoice response ----------------------");
                    console.log(response.message);

                    const invoiceNumber = response.message.name;  // ✅ THIS is what we want to return
                    
                    // Note: Txt file download disabled
                    // If you need to re-enable txt file download, uncomment the code below:
                    // frappe.call({
                    //     method: "invoice_override_pos.sales_invoice_hooks.download_invoice_json",
                    //     args: { invoice_name: invoiceNumber },
                    //     callback: function(r) {
                    //         if (r.message) {
                    //             const blob = new Blob([JSON.stringify(r.message, null, 4)], { type: "text/plain" });
                    //             const link = document.createElement("a");
                    //             link.href = URL.createObjectURL(blob);
                    //             link.download = invoiceNumber + ".txt";
                    //             link.click();
                    //         }
                    //     }
                    // });
                    
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

                    // Update progress
                    if (shouldPrint) {
                        updateProgress(70, 'Finalizing...');
                    }
                    
                    // ✅ Resolve invoice name immediately
                    resolve(invoiceNumber);
                    
                    // Save POS Entry records asynchronously (non-blocking)
                    if (payments.length > 0) {
                        setTimeout(() => {
                            frappe.call({
                                method: "havano_pos_addson.havano_pos_addson.doctype.havano_pos_entry.havano_pos_entry.save_pos_entries",
                                args: { payments: payments },
                                async: true,
                                callback: function(r) {
                                    if (r.message) {
                                        console.log("POS Entry saved successfully");
                                    }
                                }
                            });
                        }, 0);
                    }

                    // Reset form asynchronously (non-blocking)
                    setTimeout(() => {
                        itemsTableBody.innerHTML = '';
                        addNewRow();
                        updateTotals();
                    }, 100);
                } else {
                    reject("No response message from server");
                }
            },
            error: function(err) {
                if (shouldPrint) {
                    hideProgressBar();
                } else {
                    hideLoading();
                }
                const msg = 'Error creating sales invoice: ' + (err.message || 'Unknown error');
                showToast(msg, 'error');
                reject(msg);
            }
        });
    });
}


// Function to check if user has an open shift
function checkUserHasOpenShift() {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Havano POS Shift",
                filters: {
                    status: "open",
                    user: frappe.session.user
                },
                fields: ["name", "status"],
                limit_page_length: 1
            },
            callback: function(r) {
                if (r.message && r.message.length > 0) {
                    resolve(true);
                } else {
                    reject("You must have an open shift to save payments. Please open a shift first.");
                }
            },
            error: function(err) {
                reject("Error checking shift status: " + (err.message || "Unknown error"));
            }
        });
    });
}

// Save and Print Function
function saveAndPrintInvoice() {
    console.log('=== saveAndPrintInvoice started ===');
    
    // First check if user has an open shift
    checkUserHasOpenShift()
        .then(() => {
            console.log('Shift check passed');
            console.log('Calling saveSalesInvoice(true)');
            // Save with print flag
            return saveSalesInvoice(true);
        })
        .then((invoiceName) => {
            console.log('Invoice saved successfully:', invoiceName);
            console.log('Now calling printInvoice...');
            // Print the invoice
            return printInvoice(invoiceName);
        })
        .then((invoiceName) => {
            console.log('Print completed successfully');
            // Hide progress bar and close popup
            hideProgressBar();
            closePaymentPopup();
            // frappe.show_alert(`Invoice ${invoiceName} saved and printed successfully!`, 'green');
        })
        .catch(err => {
            console.error("Failed to save/print invoice:", err);
            const errorMsg = err.toString();
            
            // Hide progress bar
            hideProgressBar();
            
            // Close payment modal
            closePaymentPopup();
            
            // Show error messages
            showToast(errorMsg, 'error');
            frappe.show_alert({
                message: errorMsg,
                indicator: 'red'
            }, 5);
            
            // Show open shift modal if needed
            if (typeof haPosOpeningOpenPopup === 'function' && errorMsg.includes('shift')) {
                haPosOpeningOpenPopup("Please open a shift to continue");
            }
        });
}

// Save button event listener - Save and Print
document.getElementById("ha-pos-savepaymentdata")
  .addEventListener("click", function () {
    console.log('Save button clicked - will save and print');
    // Call the same function as F3
    saveAndPrintInvoice();
});

// F3 Key Handler - Save and Print
document.addEventListener('keydown', function(e) {
    // F3 key
    if (e.key === 'F3') {
        e.preventDefault();
        console.log('F3 key pressed');
        
        // Check if payment popup is open
        const paymentOverlay = document.getElementById('paymentOverlay');
        if (paymentOverlay && paymentOverlay.style.display === 'flex') {
            saveAndPrintInvoice();
        }
    }
});

 
// Try alternative approach - field-level event handler
frappe.ui.form.on("HA POS Setting", "selected_payment_methods", function(frm, cdt, cdn) {
  console.log("Field-level event triggered for selected_payment_methods");
  console.log("cdt:", cdt, "cdn:", cdn);
  
  let row = frappe.get_doc(cdt, cdn);
  console.log("Row data:", row);
  
  if (row.mode_of_payment) {
    console.log("Mode of payment found:", row.mode_of_payment);
    // Call the same logic as before
    handleModeOfPaymentChange(frm, cdt, cdn, row);
  }
});

// Additional debugging - try to catch any field change
frappe.ui.form.on("HA POS Setting", function(frm) {
  frm.fields_dict.selected_payment_methods.grid.wrapper.on('change', function(e) {
    console.log("Grid change event detected!");
    console.log("Event:", e);
    console.log("Target:", e.target);
  });
});

function handleModeOfPaymentChange(frm, cdt, cdn, row) {
  console.log("handleModeOfPaymentChange called");
  console.log("row", row);
  console.log("mode_of_payment value:", row.mode_of_payment);

  if (!row.mode_of_payment) {
    // Clear fields if no mode of payment selected
    frappe.model.set_value(cdt, cdn, "currency", "");
    frappe.model.set_value(cdt, cdn, "currency_symbol", "");
    frappe.model.set_value(cdt, cdn, "exchange_rate", 0);
    return;
  }

  // 1. Get Mode of Payment details and default account
  frappe.call({
    method: "frappe.client.get_value",
    args: {
      doctype: "Mode of Payment",
      fieldname: ["name", "accounts"],
      filters: { name: row.mode_of_payment }
    },
    callback: function(response) {
      console.log("response", response);
      if (response.message && response.message.accounts && response.message.accounts.length > 0) {
        // Get the first account (default account)
        const defaultAccount = response.message.accounts[0].default_account;
        console.log("defaultAccount", defaultAccount);
        if (defaultAccount) {
          // 2. Get account currency
          frappe.call({
            method: "frappe.client.get_value",
            args: {
              doctype: "Account",
              fieldname: "account_currency",
              filters: { name: defaultAccount }
            },
            callback: function(accountResponse) {
              if (accountResponse.message && accountResponse.message.account_currency) {
                const currency = accountResponse.message.account_currency;
                
                // Set currency
                frappe.model.set_value(cdt, cdn, "currency", currency);
                
                // 3. Get currency symbol
                frappe.call({
                  method: "frappe.client.get_value",
                  args: {
                    doctype: "Currency",
                    fieldname: "symbol",
                    filters: { name: currency }
                  },
                  callback: function(symbolResponse) {
                    if (symbolResponse.message && symbolResponse.message.symbol) {
                      frappe.model.set_value(cdt, cdn, "currency_symbol", symbolResponse.message.symbol);
                    }
                  }
                });
                
                // 4. Get exchange rate if currency is different from default
                if (frm.doc.default_currency && currency !== frm.doc.default_currency) {
                  frappe.call({
                    method: "frappe.client.get_value",
                    args: {
                      doctype: "Currency Exchange",
                      fieldname: "exchange_rate",
                      filters: { 
                        from_currency: frm.doc.default_currency,
                        to_currency: currency
                      },
                      order_by: "date desc"
                    },
                    callback: function(exchangeResponse) {
                      if (exchangeResponse.message && exchangeResponse.message.exchange_rate) {
                        frappe.model.set_value(cdt, cdn, "exchange_rate", exchangeResponse.message.exchange_rate);
                        frappe.show_alert({
                          message: `Exchange rate set: ${exchangeResponse.message.exchange_rate}`,
                          indicator: "green"
                        });
                      } else {
                        // Set default rate of 1 if no exchange rate found
                        frappe.model.set_value(cdt, cdn, "exchange_rate", 1);
                        frappe.show_alert({
                          message: "No exchange rate found, set to 1.0",
                          indicator: "orange"
                        });
                      }
                    },
                    error: function() {
                      frappe.model.set_value(cdt, cdn, "exchange_rate", 1);
                      frappe.show_alert({
                        message: "Error fetching exchange rate, set to 1.0",
                        indicator: "red"
                      });
                    }
                  });
                } else {
                  // Same currency as default, set rate to 1
                  frappe.model.set_value(cdt, cdn, "exchange_rate", 1);
                  frappe.show_alert({
                    message: "Same currency as default, rate set to 1.0",
                    indicator: "green"
                  });
                }
              } else {
                frappe.show_alert({
                  message: "No currency found for this account",
                  indicator: "red"
                });
              }
            },
            error: function() {
              frappe.show_alert({
                message: "Error fetching account currency",
                indicator: "red"
              });
            }
          });
        } else {
          frappe.show_alert({
            message: "No default account found for this payment method",
            indicator: "red"
          });
        }
      } else {
        frappe.show_alert({
          message: "No accounts configured for this payment method",
          indicator: "red"
        });
      }
    },
    error: function() {
      frappe.show_alert({
        message: "Error fetching payment method details",
        indicator: "red"
      });
    }
  });
}

// Test if any events are being triggered
frappe.ui.form.on("selected_payment_methods", {
  // Test event - should trigger on any field change
  refresh: function(frm, cdt, cdn) {
    console.log("selected_payment_methods refresh event triggered");
  },
  
  // Test with a more common event
  before_save: function(frm, cdt, cdn) {
    console.log("selected_payment_methods before_save event triggered");
  },
  
  // Test with change event
  change: function(frm, cdt, cdn) {
    console.log("selected_payment_methods change event triggered");
  },
  
  mode_of_payment: function(frm, cdt, cdn) {
    console.log("mode_of_payment event triggered!");
    let row = frappe.get_doc(cdt, cdn);
    console.log("row", row);
    console.log("mode_of_payment value:", row.mode_of_payment);
    handleModeOfPaymentChange(frm, cdt, cdn, row);
  },

  // Auto-calculate exchange rate when currency changes
  currency: function(frm, cdt, cdn) {
    let row = frappe.get_doc(cdt, cdn);
    
    if (!row.currency || !frm.doc.default_currency) return;
    
    if (row.currency === frm.doc.default_currency) {
      frappe.model.set_value(cdt, cdn, "exchange_rate", 1);
      return;
    }
    
    // Fetch latest exchange rate
    frappe.call({
      method: "frappe.client.get_value",
      args: {
        doctype: "Currency Exchange",
        fieldname: "exchange_rate",
        filters: { 
          from_currency: frm.doc.default_currency,
          to_currency: row.currency
        },
        order_by: "date desc"
      },
      callback: function(response) {
        if (response.message && response.message.exchange_rate) {
          frappe.model.set_value(cdt, cdn, "exchange_rate", response.message.exchange_rate);
        } else {
          frappe.model.set_value(cdt, cdn, "exchange_rate", 1);
        }
      }
    });
  }
});

// Test parent form events
frappe.ui.form.on("HA POS Setting", {
  refresh: function(frm) {
    console.log("HA POS Setting form refreshed");
  },
  
  selected_payment_methods: function(frm, cdt, cdn) {
    console.log("selected_payment_methods changed in parent form");
    console.log("cdt:", cdt, "cdn:", cdn);
  },
  
  default_currency: function(frm) {
    if (frm.doc.selected_payment_methods) {
      frm.doc.selected_payment_methods.forEach(function(row) {
        if (row.currency && row.currency !== frm.doc.default_currency) {
          // Trigger currency change to recalculate exchange rates
          frappe.model.trigger("currency", "selected_payment_methods", row.name);
        } else if (row.currency === frm.doc.default_currency) {
          frappe.model.set_value("selected_payment_methods", row.name, "exchange_rate", 1);
        }
      });
    }
  }
});
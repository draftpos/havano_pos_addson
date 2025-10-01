

frappe.ui.form.on("Havano POS Setting", {
	refresh(frm) {

	},
	
	before_save(frm) {
		// Remove rows that don't have account set (no valid account)
		if (frm.doc.selected_payment_methods) {
			let rows_to_remove = [];
			
			// Identify rows without accounts
			frm.doc.selected_payment_methods.forEach(function(row, index) {
				if (row.mode_of_payment && !row.account) {
					rows_to_remove.push(index);
				}
			});
			
			if (rows_to_remove.length > 0) {
				// Remove rows in reverse order to maintain correct indices
				rows_to_remove.reverse().forEach(function(index) {
					frm.doc.selected_payment_methods.splice(index, 1);
				});
				
				// Refresh the field to show updated table
				frm.refresh_field("selected_payment_methods");
				
				frappe.show_alert({
					message: `Removed ${rows_to_remove.length} payment method(s) without valid accounts`,
					indicator: "orange"
				});
			}
		}
	}
});

// Child table event handler for HA POS Payment Method
frappe.ui.form.on("HA POS Payment Method", {
	mode_of_payment: function(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		
		if (!row.mode_of_payment) {
			// Clear fields if no mode of payment selected
			frappe.model.set_value(cdt, cdn, "account", "");
			frappe.model.set_value(cdt, cdn, "currency", "");
			frappe.model.set_value(cdt, cdn, "currency_symbol", "");
			frappe.model.set_value(cdt, cdn, "exchange_rate", 0);
			return;
		}
		
		// Get Mode of Payment details and default account
		frappe.call({
			method: "frappe.client.get",
			args: {
				doctype: "Mode of Payment",
				name: row.mode_of_payment
			},
			callback: function(response) {
				if (response.message && response.message.accounts && response.message.accounts.length > 0) {
					// Get the first account (default account)
					const defaultAccount = response.message.accounts[0].default_account;
					
					if (defaultAccount) {
						// Set the account field
						frappe.model.set_value(cdt, cdn, "account", defaultAccount);
						
						// Get account currency
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
									
									// Get base currency
									const baseCurrency = frm.doc.default_currency;
									
									if (baseCurrency && currency !== baseCurrency) {
										// Get exchange rate
										frappe.call({
											method: "frappe.client.get_list",
											args: {
												doctype: "Currency Exchange",
												fields: ["exchange_rate", "date"],
												filters: {
													from_currency: baseCurrency,
													to_currency: currency
												},
												order_by: "date desc",
												limit: 1
											},
											callback: function(exchangeResponse) {
												if (exchangeResponse.message && exchangeResponse.message.length > 0) {
													const exchangeData = exchangeResponse.message[0];
													
													// Set exchange rate and date
													frappe.model.set_value(cdt, cdn, "exchange_rate", exchangeData.exchange_rate);
													frappe.model.set_value(cdt, cdn, "date_of_last_exchange", exchangeData.date);
													
													frappe.show_alert({
														message: `Account, currency, and exchange rate set successfully`,
														indicator: "green"
													});
												} else {
													// No exchange rate found, set to 1
													// frappe.model.set_value(cdt, cdn, "exchange_rate", 1);
													// frappe.model.set_value(cdt, cdn, "date_of_last_exchange", frappe.datetime.get_today());
													
													frappe.show_alert({
														message: `No exchange rate found. Set to 1.0`,
														indicator: "orange"
													});
												}
											},
											error: function() {
												frappe.model.set_value(cdt, cdn, "exchange_rate", 1);
												frappe.show_alert({
													message: "Error fetching exchange rate. Set to 1.0",
													indicator: "red"
												});
											}
										});
									} else {
										// Same currency as base, set rate to 1
										frappe.model.set_value(cdt, cdn, "exchange_rate", 1);
										frappe.model.set_value(cdt, cdn, "date_of_last_exchange", frappe.datetime.get_today());
										
										frappe.show_alert({
											message: `Account and currency set successfully`,
											indicator: "green"
										});
									}
								} else {
									frappe.show_alert({
										message: "No currency found for this account",
										indicator: "orange"
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
							message: "No default account found for this payment method. Row will be removed on save.",
							indicator: "orange"
						});
					}
				} else {
					frappe.show_alert({
						message: "No accounts configured for this payment method. Row will be removed on save.",
						indicator: "orange"
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
});

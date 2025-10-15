import frappe
from frappe.model.document import Document
from frappe.utils import nowdate, flt

class HavanoPOSShift(Document):
    def autoname(self):
        self.name = frappe.model.naming.make_autoname("SHIFT-.YYYY.-.#####")
        self.shift_number = self.name

    def before_save(self):
        self.calculate_totals()
        
        # Calculate expected_amount if not already set
        if not self.expected_amount:
            opening_amt = flt(self.opening_amount or 0)
            total_sales_amt = flt(self.total_sales or 0)
            self.expected_amount = str(opening_amt + total_sales_amt)
        
        self.calculate_difference()

    def calculate_totals(self):
        """Aggregate totals from Havano POS Entries linked to this shift."""
        entries = frappe.get_all(
            "Havano POS Entry",
            filters={"shift_name": self.name},
            fields=["amount", "payment_method"]
        )

        self.total_invoices = len(entries)

        # Reset child table
        self.set("payments", [])

        payment_totals = {}
        for entry in entries:
            method = entry.payment_method or "Unknown"
            payment_totals[method] = payment_totals.get(method, 0) + (entry.amount or 0)

        for method, total in payment_totals.items():
            self.append("payments", {
                "payment_method": method,
                "amount": total
            })

    def calculate_difference(self):
        """Calculate difference between expected closing and actual closing."""
        # Use expected_amount if set, otherwise calculate it
        if self.expected_amount:
            expected = flt(self.expected_amount)
        else:
            expected = flt(self.opening_amount or 0) + flt(self.total_sales or 0)
        
        closing = flt(self.closing_amount or 0)
        self.difference = closing - expected




import frappe
from frappe.utils import nowdate, flt

@frappe.whitelist()
def open_shift(openingAmount=None):
    """Mark a shift as open and set opening amount for current user."""
    
    current_user = frappe.session.user

    # Check if current user already has an open shift
    existing_open = frappe.db.exists("Havano POS Shift", {
        "status": "open",
        "user": current_user
    })
    if existing_open:
        frappe.throw("You cannot open a new shift while you have another shift still open.")

    # Make sure openingAmount is safely converted to a number
    opening_amount_value = flt(openingAmount) if openingAmount else 0

    # Create new shift document
    doc = frappe.new_doc("Havano POS Shift")
    doc.status = "open"
    doc.user = current_user
    doc.opening_amount = opening_amount_value
    doc.shift_date = nowdate()

    # Save the document ignoring user permissions
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "name": doc.name,
        "status": doc.status,
        "opening_amount": doc.opening_amount,
        "user": doc.user
    }




@frappe.whitelist()
def close_shift(shift_name: str, closing_amount: float = 0, payments: list | str = None):
    """Mark a shift as closed, save payments, calculate totals/difference, and submit the shift."""
    current_user = frappe.session.user
    
   
    if not frappe.db.exists("Havano POS Shift", shift_name):
        frappe.throw(f"Shift {shift_name} not found")

    doc = frappe.get_doc("Havano POS Shift", shift_name)
    
    # Verify that the current user owns this shift
    if doc.user != current_user:
        frappe.throw(f"You cannot close this shift. It belongs to {doc.user}.")

    if isinstance(payments, str):
        import json
        payments = json.loads(payments)

    doc.status = "closed"

    # Save closing amount
    if closing_amount:
        doc.closing_amount = closing_amount

    # Recalculate totals from POS entries (this sets payments table from actual sales)
    doc.calculate_totals()
    
    # Calculate expected amount (opening + total_sales)
    opening_amt = flt(doc.opening_amount or 0)
    total_sales_amt = flt(doc.total_sales or 0)
    doc.expected_amount = str(opening_amt + total_sales_amt)
    
    # Reset shift_amount child table
    doc.set("shift_amount", [])

    # Add values from UI to shift_amount table only (what user entered in close modal)
    if payments:
        print(f"Received {len(payments)} payment methods from close shift modal:")
        for p in payments:
            if not p.get("payment_method"):
                continue
            amount = float(p.get("amount") or 0)
            print(f"  - {p['payment_method']}: {amount}")
            
            # Add to shift_amount table (closing amounts from modal)
            doc.append("shift_amount", {
                "payment_method": p["payment_method"],
                "close_amount": str(amount)
            })
        print(f"Added {len(doc.shift_amount)} rows to shift_amount table")
        print(f"Payments table has {len(doc.payments)} rows from POS entries")

    # Calculate difference (closing_amount - expected_amount)
    doc.calculate_difference()
    
    print(f"Shift amounts - Opening: {doc.opening_amount}, Sales: {doc.total_sales}, Expected: {doc.expected_amount}, Closing: {doc.closing_amount}, Difference: {doc.difference}")

    # Save and submit the shift
    doc.save(ignore_permissions=True)
    doc.submit()
    frappe.db.commit()

    return {
        "name": doc.name,
        "status": doc.status,
        "closing_amount": doc.closing_amount,
        "difference": doc.difference,
        "total_invoices": doc.total_invoices,
        "payments": [{"method": p.payment_method, "amount": p.amount} for p in doc.payments],
    }


@frappe.whitelist()
def create_payment_entries_for_shift(shift_name: str, payments: list | str = None):
    """Create one payment entry per payment method in the shift's payments child table."""
    if not frappe.db.exists("Havano POS Shift", shift_name):
        frappe.throw(f"Shift {shift_name} not found")
    
    # Get shift details
    shift_doc = frappe.get_doc("Havano POS Shift", shift_name)
    shift_date = shift_doc.shift_date
    
    # Get company
    company = frappe.defaults.get_user_default("Company") or frappe.db.get_single_value("Global Defaults", "default_company")
    
    if not shift_doc.payments:
        return {"message": "No payment methods found in shift", "count": 0}
    
    created_payments = []
    
    # Create one payment entry for each payment method in the shift
    for payment_row in shift_doc.payments:
        if not payment_row.payment_method or not payment_row.amount:
            continue
            
        method = payment_row.payment_method
        amount = float(payment_row.amount)
        
        # Get payment method details and account
        payment_account = get_payment_account(method, company)
        
        if not payment_account:
            frappe.log_error(f"No account found for payment method {method}", "Payment Entry Creation")
            continue
        
        # Get currencies
        company_currency = frappe.get_value("Company", company, "default_currency")
        paid_from_account = get_default_company_account("default_receivable_account", company)
        paid_from_currency = get_account_currency(paid_from_account, company) or company_currency
        paid_to_currency = get_account_currency(payment_account, company) or company_currency
        
        # Calculate exchange rates
        source_exchange_rate = 1
        target_exchange_rate = 1
        paid_amount = amount
        received_amount = amount
        
        # If currencies differ, get exchange rate
        if paid_from_currency != paid_to_currency:
            # Get exchange rate from paid_from_currency to paid_to_currency
            exchange_rate = get_exchange_rate(paid_from_currency, paid_to_currency, shift_date)
            target_exchange_rate = exchange_rate
            received_amount = amount * exchange_rate
        
        # Get or create default POS customer
        default_customer = get_or_create_default_customer(company)
        
        # Create Payment Entry
        payment_entry = frappe.new_doc("Payment Entry")
        payment_entry.payment_type = "Receive"
        payment_entry.party_type = "Customer"
        payment_entry.party = default_customer
        payment_entry.company = company
        payment_entry.posting_date = shift_date
        payment_entry.paid_amount = paid_amount
        payment_entry.received_amount = received_amount
        payment_entry.source_exchange_rate = source_exchange_rate
        payment_entry.target_exchange_rate = target_exchange_rate
        payment_entry.paid_from_account_currency = paid_from_currency
        payment_entry.paid_to_account_currency = paid_to_currency
        payment_entry.mode_of_payment = method
        payment_entry.reference_no = shift_name
        payment_entry.reference_date = shift_date
        payment_entry.remarks = f"POS Payment - {method} - Shift: {shift_name} - Amount: {amount} {paid_from_currency}"
        
        # Set accounts - paid_from is debtors (receivable), paid_to is the payment account
        payment_entry.paid_from = paid_from_account
        payment_entry.paid_to = payment_account
        
        # Save and submit payment entry
        try:
            payment_entry.insert(ignore_permissions=True)
            payment_entry.submit()
            
            created_payments.append({
                "payment_entry": payment_entry.name,
                "method": method,
                "paid_amount": paid_amount,
                "received_amount": received_amount,
                "paid_from_currency": paid_from_currency,
                "paid_to_currency": paid_to_currency,
                "exchange_rate": target_exchange_rate,
                "account": payment_account
            })
        except Exception as e:
            error_msg = f"Payment Method: {method}, From: {paid_from_currency}, To: {paid_to_currency}, Amount: {amount}, Error: {str(e)}"
            frappe.log_error(error_msg, "Payment Entry Creation Failed")
            continue
    
    frappe.db.commit()
    
    return {
        "message": f"Created {len(created_payments)} payment entries",
        "count": len(created_payments),
        "payments": created_payments
    }


def get_payment_account(payment_method, company=None):
    """Get the payment account for a given payment method."""
    if not company:
        company = frappe.defaults.get_user_default("Company") or frappe.db.get_single_value("Global Defaults", "default_company")
    
    # Try to get from Payment Method settings
    try:
        payment_method_doc = frappe.get_doc("Mode of Payment", payment_method)
        if payment_method_doc.accounts:
            # Find account for the specific company
            for account_row in payment_method_doc.accounts:
                if account_row.company == company and account_row.default_account:
                    return account_row.default_account
            # If no company match, return first account
            if payment_method_doc.accounts[0].default_account:
                return payment_method_doc.accounts[0].default_account
    except Exception as e:
        frappe.log_error(f"Error getting payment account for {payment_method}: {str(e)}", "Get Payment Account")
    
    # Fallback to default accounts
    if payment_method.lower() == "cash":
        return frappe.get_value("Company", company, "default_cash_account")
    else:
        return frappe.get_value("Company", company, "default_bank_account") or frappe.get_value("Company", company, "default_cash_account")


def get_account_currency(account, company=None):
    """Get the currency for a given account."""
    if not account:
        return None
    
    if not company:
        company = frappe.defaults.get_user_default("Company") or frappe.db.get_single_value("Global Defaults", "default_company")
    
    try:
        account_currency = frappe.get_value("Account", account, "account_currency")
        if account_currency:
            return account_currency
        # Fallback to company default currency
        return frappe.get_value("Company", company, "default_currency")
    except:
        return frappe.get_value("Company", company, "default_currency")


def get_default_company_account(account_field, company=None):
    """Get default company account for the given field."""
    if not company:
        company = frappe.defaults.get_user_default("Company") or frappe.db.get_single_value("Global Defaults", "default_company")
    
    try:
        return frappe.get_value("Company", company, account_field)
    except:
        return None


def get_or_create_default_customer(company=None):
    """Get or create a default POS customer for payment entries."""
    if not company:
        company = frappe.defaults.get_user_default("Company") or frappe.db.get_single_value("Global Defaults", "default_company")
    
    customer_name = "POS Customer"
    
    # Check if customer exists
    if frappe.db.exists("Customer", customer_name):
        return customer_name
    
    # Create default POS customer
    try:
        customer = frappe.new_doc("Customer")
        customer.customer_name = customer_name
        customer.customer_type = "Individual"
        customer.customer_group = frappe.db.get_single_value("Selling Settings", "customer_group") or "Individual"
        customer.territory = frappe.db.get_single_value("Selling Settings", "territory") or "All Territories"
        customer.insert(ignore_permissions=True)
        frappe.db.commit()
        return customer.name
    except Exception as e:
        frappe.log_error(f"Error creating default POS customer: {str(e)}", "Create POS Customer")
        # Fallback to any existing customer
        existing_customer = frappe.db.get_value("Customer", {}, "name")
        if existing_customer:
            return existing_customer
        frappe.throw("Unable to create or find a default customer for POS payment entries")


def get_exchange_rate(from_currency, to_currency, transaction_date=None):
    """Get exchange rate between two currencies."""
    if from_currency == to_currency:
        return 1.0
    
    if not transaction_date:
        transaction_date = nowdate()
    
    # Try to get from Currency Exchange
    exchange_rate = frappe.db.get_value(
        "Currency Exchange",
        {
            "from_currency": from_currency,
            "to_currency": to_currency,
            "date": ("<=", transaction_date)
        },
        "exchange_rate",
        order_by="date desc"
    )
    
    if exchange_rate:
        return flt(exchange_rate)
    
    # Try reverse rate
    reverse_rate = frappe.db.get_value(
        "Currency Exchange",
        {
            "from_currency": to_currency,
            "to_currency": from_currency,
            "date": ("<=", transaction_date)
        },
        "exchange_rate",
        order_by="date desc"
    )
    
    if reverse_rate:
        return 1 / flt(reverse_rate)
    
    # Default to 1 if no exchange rate found
    frappe.log_error(
        f"No exchange rate found for {from_currency} to {to_currency} on {transaction_date}. Using 1.0",
        "Exchange Rate Not Found"
    )
    return 1.0

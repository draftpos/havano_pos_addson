import frappe
from frappe.model.document import Document
from frappe.utils import nowdate, flt

class HavanoPOSShift(Document):
    def autoname(self):
        self.name = frappe.model.naming.make_autoname("SHIFT-.YYYY.-.#####")
        self.shift_number = self.name

    def before_save(self):
        self.calculate_totals()
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
        expected = (self.opening_amount or 0) + sum(p.amount for p in self.payments)
        closing = self.closing_amount or 0
        self.difference = closing - expected




import frappe
from frappe.utils import nowdate, flt

@frappe.whitelist()
def open_shift(openingAmount=None):
    """Mark a shift as open and set opening amount."""

    # Check if there is already an open shift
    existing_open = frappe.db.exists("Havano POS Shift", {"status": "open"})
    if existing_open:
        frappe.throw("You cannot open a new shift while another shift is still open.")

    # Make sure openingAmount is safely converted to a number
    opening_amount_value = flt(openingAmount) if openingAmount else 0

    # Create new shift document
    doc = frappe.new_doc("Havano POS Shift")
    doc.status = "open"
    doc.opening_amount = opening_amount_value
    doc.shift_date = nowdate()

    # Save the document ignoring user permissions
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "name": doc.name,
        "status": doc.status,
        "opening_amount": doc.opening_amount
    }




@frappe.whitelist()
def close_shift(shift_name: str, closing_amount: float = 0, payments: list | str = None):
    """Mark a shift as closed, save payments, and calculate totals/difference."""
    print("closing shift data -------------------------")
    print(shift_name)
    print(closing_amount)
    print(payments)
    if not frappe.db.exists("Havano POS Shift", shift_name):
        frappe.throw(f"Shift {shift_name} not found")

    if isinstance(payments, str):
        import json
        payments = json.loads(payments)

    doc = frappe.get_doc("Havano POS Shift", shift_name)
    doc.status = "closed"

    # Save closing amount
    if closing_amount:
        doc.closing_amount = closing_amount

    # Reset payments child table
    doc.set("payments", [])

    # Add payments from UI
    if payments:
        for p in payments:
            if not p.get("payment_method"):
                continue
            amount = float(p.get("amount") or 0)
            doc.append("payments", {
                "payment_method": p["payment_method"],
                "amount": amount
            })

    # Recalculate totals
    doc.calculate_totals()
    doc.calculate_difference()

    doc.save(ignore_permissions=True)
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
    """Create payment entries for all sales invoices for the shift date."""
    if not frappe.db.exists("Havano POS Shift", shift_name):
        frappe.throw(f"Shift {shift_name} not found")
    
    # Get shift details
    shift_doc = frappe.get_doc("Havano POS Shift", shift_name)
    shift_date = shift_doc.shift_date
    
    if isinstance(payments, str):
        import json
        payments = json.loads(payments)
    
    # Get all sales invoices for the shift date
    sales_invoices = frappe.get_all(
        "Sales Invoice",
        filters={
            "posting_date": shift_date,
            "docstatus": 1  # Only submitted invoices
        },
        fields=["name", "grand_total", "currency", "customer"]
    )
    
    if not sales_invoices:
        return {"message": "No sales invoices found for this shift date", "count": 0}
    
    created_payments = []
    
    # Group payments by method for easier lookup
    payment_methods = {}
    for payment in payments:
        if payment.get("payment_method") and payment.get("amount"):
            payment_methods[payment["payment_method"]] = float(payment["amount"])
    
    # Create payment entries for each invoice
    for invoice in sales_invoices:
        invoice_total = float(invoice["grand_total"])
        remaining_amount = invoice_total
        
        # Create payment entries for each payment method
        for method, amount in payment_methods.items():
            if remaining_amount <= 0:
                break
                
            # Calculate payment amount (proportional or remaining)
            payment_amount = min(amount, remaining_amount)
            
            if payment_amount > 0:
                # Get payment account
                payment_account = get_payment_account(method)
                
                # Create Payment Entry
                payment_entry = frappe.new_doc("Payment Entry")
                payment_entry.payment_type = "Receive"
                payment_entry.party_type = "Customer"
                payment_entry.party = invoice["customer"]
                payment_entry.paid_amount = payment_amount
                payment_entry.received_amount = payment_amount
                payment_entry.currency = invoice["currency"]
                payment_entry.mode_of_payment = method
                payment_entry.reference_no = f"POS-{shift_name}"
                payment_entry.reference_date = shift_date
                payment_entry.remarks = f"POS Payment - {method} - Shift: {shift_name}"
                
                # Set accounts properly
                if is_receivable_account(payment_account):
                    # If payment account is receivable, use it as paid_from and cash as paid_to
                    payment_entry.paid_from = payment_account
                    payment_entry.paid_to = get_default_company_account("default_cash_account")
                else:
                    # If payment account is cash/bank, use it as paid_to
                    payment_entry.paid_to = payment_account
                
                # Add reference to sales invoice
                payment_entry.append("references", {
                    "reference_doctype": "Sales Invoice",
                    "reference_name": invoice["name"],
                    "allocated_amount": payment_amount
                })
                
                # Save payment entry
                payment_entry.insert(ignore_permissions=True)
                payment_entry.submit()
                
                created_payments.append({
                    "payment_entry": payment_entry.name,
                    "invoice": invoice["name"],
                    "method": method,
                    "amount": payment_amount,
                    "currency": invoice["currency"]
                })
                
                remaining_amount -= payment_amount
                amount -= payment_amount  # Reduce available amount for this method
    
    frappe.db.commit()
    
    return {
        "message": f"Created {len(created_payments)} payment entries",
        "count": len(created_payments),
        "payments": created_payments
    }


def get_payment_account(payment_method):
    """Get the payment account for a given payment method."""
    # Try to get from Payment Method settings
    try:
        payment_method_doc = frappe.get_doc("Mode of Payment", payment_method)
        if payment_method_doc.accounts:
            return payment_method_doc.accounts[0].default_account
    except:
        pass
    
    # Fallback to default accounts
    if payment_method.lower() == "cash":
        return frappe.get_value("Company", frappe.defaults.get_user_default("Company"), "default_cash_account")
    else:
        return frappe.get_value("Company", frappe.defaults.get_user_default("Company"), "default_receivable_account")


def is_receivable_account(account):
    """Check if the account is a receivable account."""
    try:
        account_doc = frappe.get_doc("Account", account)
        return account_doc.account_type == "Receivable"
    except:
        return False


def get_default_company_account(account_field):
    """Get default company account for the given field."""
    try:
        company = frappe.defaults.get_user_default("Company")
        return frappe.get_value("Company", company, account_field)
    except:
        return None

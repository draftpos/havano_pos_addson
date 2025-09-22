import frappe
from frappe.model.document import Document
from frappe.utils import nowdate


class HavanoPOSEntry(Document):
    def validate(self):
        if self.amount and self.amount < 0:
            frappe.throw("Amount cannot be negative.")

        if not self.payment_method:
            frappe.throw("Payment Method is required.")

        # if self.shift_name:
        #     exists = frappe.db.exists(
        #         "Havano POS Shift",  
        #         {"shift_name": self.shift_name}
        #     )
        #     if not exists:
        #         frappe.throw(f"Shift {self.shift_name} does not exist.")






@frappe.whitelist()
def save_pos_entries(payments):
    print("incoming payment list------------------")
    print(payments)
    """
    Insert multiple Havano POS Entry records at once.
    `payments` should be a list of dicts with:
    invoice_number, invoice_date, payment_method, amount, currency, shift_number
    """
    if isinstance(payments, str):
        # if sent as JSON string, parse it
        import json
        payments = json.loads(payments)

    results = []
    for p in payments:
        # ✅ Basic validation
        if not p.get("shift_name"):
            frappe.throw("Shift number is required for POS Entry")
        if not p.get("payment_method"):
            frappe.throw("Payment method is required for POS Entry")
        if not p.get("amount") or float(p.get("amount")) <= 0:
            continue  # skip zero/negative payments

        # Create and insert document
        doc = frappe.get_doc({
            "doctype": "Havano POS Entry",
            "invoice_number": p.get("invoice_number"),
            "invoice_date": p.get("invoice_date") or nowdate(),
            "payment_method": p.get("payment_method"),
            "amount": p.get("amount"),
            "currency": p.get("currency") or "USD",
            "shift_name": p.get("shift_name")
        })
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        results.append(doc.name)

    return {"created": results}


import frappe
from frappe.model.document import Document

class HavanoPOSShift(Document):
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
from frappe.utils import nowdate

@frappe.whitelist()
def open_shift(shift_name: str, opening_amount: float = 0):
    """Mark a shift as open and set opening amount."""
    if not frappe.db.exists("Havano POS Shift", shift_name):
        frappe.throw(f"Shift {shift_name} not found")

    doc = frappe.get_doc("Havano POS Shift", shift_name)
    doc.status = "open"
    if opening_amount:
        doc.opening_amount = opening_amount
    if not doc.shift_date:
        doc.shift_date = nowdate()

    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {"name": doc.name, "status": doc.status, "opening_amount": doc.opening_amount}


@frappe.whitelist()
def close_shift(shift_name: str, closing_amount: float = 0, payments: list | str = None):
    """Mark a shift as closed, save payments, and calculate totals/difference."""
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

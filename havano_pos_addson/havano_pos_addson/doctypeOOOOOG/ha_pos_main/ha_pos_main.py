import frappe
from frappe.model.document import Document
from frappe import _

class HaPosMain(Document):
    pass
#     def validate(self):
#         self.calculate_totals()
    
#     def calculate_totals(self):
#         """Calculate subtotal and update amounts"""
#         subtotal = 0
        
#         for item in self.items:
#             # Calculate amount for each item
#             item.amount = item.qty * item.rate if item.qty and item.rate else 0
#             subtotal += item.amount
        
#         # Update subtotal values
#         self.subtotal_value = subtotal
#         self.subtotal = f"Subtotal: {frappe.format_value(subtotal, {'fieldtype': 'Currency'})}"
    
#     def on_update(self):
#         """Auto-fetch item details when item code is entered"""
#         for item in self.items:
#             if item.item_code and not item.item_name:
#                 self.fetch_item_details(item)
    
#     def fetch_item_details(self, item):
#         """Fetch item details from Item master"""
#         if item.item_code:
#             item_details = frappe.get_cached_value("Item", item.item_code, 
#                 ["item_name", "stock_uom", "standard_rate"], as_dict=1)
            
#             if item_details:
#                 item.item_name = item_details.item_name
#                 item.uom = item_details.stock_uom
#                 if not item.rate:
#                     item.rate = item_details.standard_rate

# @frappe.whitelist()
# def get_item_details(item_code, price_list=None, customer=None):
#     """Get item details for POS"""
#     if not item_code:
#         return {}
    
#     # Get basic item details
#     item = frappe.get_cached_doc("Item", item_code)
    
#     # Get price from price list if available
#     rate = item.standard_rate
    
#     if price_list:
#         price_list_rate = frappe.db.get_value("Item Price", {
#             "item_code": item_code,
#             "price_list": price_list,
#             "selling": 1
#         }, "price_list_rate")
        
#         if price_list_rate:
#             rate = price_list_rate
    
#     return {
#         "item_name": item.item_name,
#         "uom": item.stock_uom,
#         "rate": rate
#     }

# @frappe.whitelist()
# def create_sales_invoice_from_pos(source_name, target_doc=None):
#     """Create Sales Invoice from POS Main"""
#     from frappe.model.mapper import get_mapped_doc
    
#     def set_missing_values(source, target):
#         target.is_pos = 1
#         target.set_posting_time = 1
        
#         # Set customer details
#         if source.customer:
#             customer = frappe.get_doc("Customer", source.customer)
#             target.customer_name = customer.customer_name
        
#         # Calculate totals
#         target.update({
#             "items": source.items
#         })
    
#     doc = get_mapped_doc("HA POS Main", source_name, {
#         "HA POS Main": {
#             "doctype": "Sales Invoice",
#             "field_map": {
#                 "customer": "customer",
#                 "price_list": "selling_price_list",
#                 "subtotal_value": "total",
#                 "warehouse": "set_warehouse"
#             }
#         },
#         "POS Invoice Item": {
#             "doctype": "Sales Invoice Item",
#             "field_map": {
#                 "item_code": "item_code",
#                 "item_name": "item_name",
#                 "uom": "uom",
#                 "qty": "qty",
#                 "rate": "rate",
#                 "amount": "amount"
#             }
#         }
#     }, target_doc, set_missing_values)
    
#     return doc
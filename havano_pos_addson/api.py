import frappe
from frappe import _

@frappe.whitelist()
def get_customers():
    """Get all active customers"""
    customers = frappe.get_all("Customer",
        fields=["name", "customer_name"],
        filters={"disabled": 0},
        order_by="customer_name"
    )
    return customers

@frappe.whitelist()
def get_price_lists():
    """Get all selling price lists"""
    price_lists = frappe.get_all("Price List",
        fields=["name", "price_list_name"],
        filters={"enabled": 1, "selling": 1},
        order_by="name"
    )
    return price_lists

@frappe.whitelist()
def search_items(search_term=None):
    """Search for items by name or code"""
    filters = {"disabled": 0}
    
    if search_term:
        filters["item_name"] = ["like", f"%{search_term}%"]
    
    items = frappe.get_all("Item",
        fields=["name", "item_code", "item_name", "description", "stock_uom", "standard_rate"],
        filters=filters,
        order_by="item_name",
        limit=20
    )
    return items


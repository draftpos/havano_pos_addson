from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import nowdate, getdate, flt, cint, now_datetime
from frappe import _
import json


class HAPOSSetting(Document):
    pass
    # @staticmethod
    # def get_settings():
    #     """Retrieve HA POS Settings."""
    #     settings = frappe.get_single("HA POS Settings")
    #     return settings

    # @staticmethod
    # def update_settings(settings_data):
    #     """Update HA POS Settings."""
    #     settings = frappe.get_single("HA POS Settings")
    #     settings.ha_pos_settings_on = settings_data.get("ha_pos_settings_on", settings.ha_pos_settings_on)
    #     settings.on_pres_enter = settings_data.get("on_pres_enter", settings.on_pres_enter)

    #     settings.save()
    #     frappe.db.commit()
    #     return settings

    # @staticmethod
    # def create_settings():
    #     """Create HA POS Settings if it doesn't exist."""
    #     if not frappe.get_all("HA POS Settings"):
    #         settings = frappe.get_doc({
    #             "doctype": "HA POS Settings",
    #             "ha_pos_settings_on": 0,
    #             "on_pres_enter": "Move to Next Row"
    #         })
    #         settings.insert()
    #         frappe.db.commit()
    #         return settings
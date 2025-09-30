function checkOpenShift(callback) {
  const today = new Date().toISOString().split('T')[0];

  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "Havano POS Shift",
      filters: {
        status: "open"
      },
      fields: ["name", "shift_date", "status"],
      limit_page_length: 1
    },
    callback: function(r) {
        // console.log("shift check");
        // console.log(r);
        localStorage.setItem("havano_pos_shift", JSON.stringify(r));
      if (!r.message || r.message.length === 0) {
        // No open shift
        // alert("Please open a shift first");
        haPosOpeningOpenPopup("Please open a shift first");
        if (callback) callback(false);
        return;
      }

      const shift = r.message[0];
      if (shift.shift_date === today) {
        // Shift is for today → OK
        if (callback) callback(true, shift);
      } else {
        // Shift is open but date mismatch
        openShiftPopup("Close the yesterday shift and open another");
        // alert("Close the yesterday shift and open another");
        if (callback) callback(false, shift);
      }
    },
    error: function(err) {
      // console.error("Error checking open shift:", err);
      if (callback) callback(false);
    }
  });
}



checkOpenShift(function(ok, shift) {
  if (ok) {
    // console.log("Shift is open and valid:", shift.name);
  } else {
    // console.log("No valid shift available.");
  }
});
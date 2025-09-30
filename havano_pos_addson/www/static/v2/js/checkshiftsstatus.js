

function checkShiftStatus() {
  let data = localStorage.getItem("havano_pos_shift");

  if (!data) {
    // openShiftPopup();
    // showHaPopupCustom("Please open a shift first");
   
    return false;
  }

  let m;
  try {
    m = JSON.parse(data);
  } catch (e) {
    // console.error("Invalid JSON in havano_pos_shift", e);
    // showHaPopupCustom("Shift data corrupted. Please open shift again.");
    return false;
  }

  if (!m.message || m.message.length === 0) {
    // showHaPopupCustom("Please open a shift first");
    return false;
  }

  const shift = m.message[0];
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  if (shift.status === "closed") {
    // showHaPopupCustom("Open shift to continue.");
    return false;
  }

  if (shift.status === "open" && shift.shift_date !== today) {
    // showHaPopupCustom("Close the yesterday shift first to continue.");
    return false;
  }

  // ✅ All good
  return true;
}



if (checkShiftStatus()) {
  // proceed with invoice creation or other actions
  // console.log("Shift is valid, continue...");
}
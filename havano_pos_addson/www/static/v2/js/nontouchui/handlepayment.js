document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('paymentOverlay');
  if (!overlay) {
    console.error('paymentOverlay element not found. Aborting payment popup init.');
    return;
  }
  
  // State
  let activeInput = null;
  let popupInitialized = false;
  let subWatchInterval = null;
  const subTotalEl = document.getElementById('sub_total');
  let lastKnownSubTotal = subTotalEl ? subTotalEl.value : null;

  // --------------------------
  // Helpers (safe, scoped)
  // --------------------------
  function getTotalAmount() {
    // Read-only: never write to #sub_total here
    return subTotalEl ? parseFloat(subTotalEl.value) || 0 : 0;
  }

  function safeSetInputValue(inputEl, valueStr) {
    if (!inputEl) return;
    if (inputEl.id === 'sub_total') {
      // Never overwrite the external subtotal
      console.warn('Attempt to write #sub_total prevented.');
      return;
    }
    inputEl.value = valueStr;
  }

  function setMethodValue(methodContainer, value) {
    if (!methodContainer) return;
    const bEl = methodContainer.querySelector('b');
    const inputEl = methodContainer.querySelector('input');
    if (!bEl || !inputEl) return;

    const v = (typeof value === 'number') ? value : (parseFloat(value) || 0);
    bEl.textContent = v.toFixed(2);

    // Protect external subtotal if somehow present
    if (inputEl.id === 'sub_total') {
      console.warn('Skipped writing to an input with id=sub_total inside setMethodValue.');
    } else {
      inputEl.value = v.toFixed(2);
      activeInput = inputEl;
      activeInput.focus();
    }
  }

  function resetPopupMethods() {
    // Only reset methods inside the popup
    const methods = overlay.querySelectorAll('.ha-pos-payment-pop-method');
    methods.forEach(method => {
      const bEl = method.querySelector('b');
      const inputEl = method.querySelector('input');
      if (!bEl || !inputEl) return;
      bEl.textContent = '0.00';
      if (inputEl.id === 'sub_total') {
        // Never clear the external subtotal if it's accidentally included
        console.warn('Skipped clearing input with id=sub_total during resetPopupMethods.');
      } else {
        inputEl.value = '';
      }
    });
    activeInput = null;
  }

  function syncDisplay(inputEl) {
    if (!inputEl || inputEl.id === 'sub_total') return;
    const container = inputEl.closest('.ha-pos-payment-method-base-currency');
    const bEl = container ? container.querySelector('b') : null;
    if (!bEl) return;
    
    let inputValue = parseFloat(inputEl.value) || 0;
    const totalAmount = getTotalAmount();
    
    // Calculate sum of OTHER payments (excluding current input)
    let sumOtherPayments = 0;
    overlay.querySelectorAll('.ha-pos-payment-pop-method-input').forEach(input => {
      if (input.id === 'sub_total') return;
      if (input === inputEl) return; // Skip current input
      sumOtherPayments += parseFloat(input.value) || 0;
    });
    
    // Calculate max allowed for current input
    const maxAllowed = totalAmount - sumOtherPayments;
    
    // If input exceeds maximum, cap it
    if (inputValue > maxAllowed && maxAllowed >= 0) {
      inputValue = maxAllowed;
      inputEl.value = maxAllowed.toFixed(2);
      console.log(`Payment capped to ${maxAllowed.toFixed(2)} (max allowed)`);
    }
    
    // Update display
    bEl.textContent = inputValue.toFixed(2);
  }

  // --------------------------
  // Totals (scoped)
  // --------------------------
  function updateTotals() {
    const totalAmount = getTotalAmount();
    let sumPaid = 0;

    // Only sum popup inputs (scoped inside overlay)
    overlay.querySelectorAll('.ha-pos-payment-pop-method-input').forEach(input => {
      if (input.id === 'sub_total') return; // safety
      sumPaid += parseFloat(input.value) || 0;
    });

    const change = sumPaid - totalAmount;

    const totalEl = document.getElementById('ha-pos-payment-pop-total-amount');
    if (totalEl) totalEl.textContent = totalAmount.toFixed(2);

    const changeEl = overlay.querySelector('#ha-pos-payment-pop-change-footer-section') || document.querySelector('#ha-pos-payment-pop-change-footer-section');
    if (changeEl) changeEl.textContent = (change > 0 ? change.toFixed(2) : '0.00');
  }

  // --------------------------
  // Keypad behavior
  // --------------------------
  function handleKeypadInput(value) {
    if (!activeInput) return;
    if (activeInput.id === 'sub_total') {
      console.warn('Keypad prevented from writing to #sub_total.');
      return;
    }
    // If input currently is "0.00" or empty, start fresh (so buttons act like entering numbers)
    if (activeInput.value === '0.00' || activeInput.value === '') activeInput.value = '';

    // Append the button text (some buttons are '10', '20', '100', etc.)
    activeInput.value = String(activeInput.value || '') + String(value).trim();

    syncDisplay(activeInput);
    updateTotals();
  }

  function clearActiveInput() {
    if (!activeInput || activeInput.id === 'sub_total') return;
    activeInput.value = '';
    syncDisplay(activeInput);
    updateTotals();
  }

  function backspaceActiveInput() {
    if (!activeInput || activeInput.id === 'sub_total') return;
    activeInput.value = String(activeInput.value || '').slice(0, -1);
    syncDisplay(activeInput);
    updateTotals();
  }

  // --------------------------
  // Event hookup (once)
  // --------------------------
  function setupEventHandlersOnce() {
    if (popupInitialized) return;
    popupInitialized = true;

    // Keypad numeric buttons
    overlay.querySelectorAll('.ha-pos-payment-pop-btn-num').forEach(btn => {
      btn.addEventListener('click', function () {
        handleKeypadInput(btn.textContent);
      });
    });

    // Special keypad buttons (Back, Clear, Cancel, etc)
    overlay.querySelectorAll('.ha-pos-payment-pop-btn').forEach(btn => {
      const txt = (btn.textContent || '').trim();
      if (txt === 'Clear') btn.addEventListener('click', clearActiveInput);
      else if (txt === 'Back') btn.addEventListener('click', backspaceActiveInput);
      else if (txt === 'Cancel') btn.addEventListener('click', closePaymentPopup);
      else if (txt === '.') btn.addEventListener('click', function() {
        handleKeypadInput('.');
      });
      // leave other buttons alone (e.g. numeric duplicates handled above)
    });

    // Payment-method click -> make that method's input active
    overlay.querySelectorAll('.ha-pos-payment-pop-method').forEach(method => {
      method.addEventListener('click', function (e) {
        const container = method.querySelector('.ha-pos-payment-method-base-currency');
        if (!container) return;
        const inputEl = container.querySelector('input');
        if (!inputEl) return;

        if (inputEl.id === 'sub_total') {
          console.warn('Clicked input is #sub_total, ignoring to avoid overwriting outside subtotal.');
          return;
        }

        activeInput = inputEl;
        activeInput.focus();
      });
    });

    // If user types directly into popup inputs, keep display & totals in sync
    overlay.querySelectorAll('.ha-pos-payment-pop-method-input').forEach(input => {
      input.addEventListener('input', function () {
        if (input.id === 'sub_total') return;
        syncDisplay(input);
        updateTotals();
      });
    });
  }

  // --------------------------
  // Protect external subtotal while popup is open (watcher)
  // --------------------------
  function startSubTotalWatcher() {
    if (!subTotalEl) return;
    lastKnownSubTotal = subTotalEl.value;
    // poll rapidly while popup open; revert immediate accidental zeroing
    subWatchInterval = setInterval(() => {
      if (overlay.style.display === 'flex') {
        const current = subTotalEl.value;
        // if it was changed to empty or zero unexpectedly, restore it
        if ((current === '' || current === '0' || current === '0.00') && lastKnownSubTotal && lastKnownSubTotal !== current) {
          console.warn('Detected accidental change to #sub_total while popup open — restoring previous value.');
          subTotalEl.value = lastKnownSubTotal;
        } else {
          // accept legitimate changes (update last known)
          if (current !== lastKnownSubTotal) lastKnownSubTotal = current;
        }
      } else {
        // popup closed -> stop watcher
        clearInterval(subWatchInterval);
        subWatchInterval = null;
      }
    }, 120); // 120ms is responsive but light-weight
  }

  // --------------------------
  // Open/Close: exposed globally so your inline onclicks still work
  // --------------------------
  window.openPaymentPopup = function () {
    setupEventHandlersOnce();     // ensure handlers exist (only once)
    resetPopupMethods();          // reset only popup fields
    const totalAmount = getTotalAmount();
    const cashMethodContainer = overlay.querySelector('.ha-pos-payment-method-cash-amount-container');
    const cash_default = document.getElementById("ha-pos-payment-pop-total-amount");
    // const cash_default = document.querySelector(".ha-total-value");
    
    cash_default.innerHTML = totalAmount;
    
    if (cashMethodContainer) setMethodValue(cashMethodContainer, totalAmount);
    updateTotals();
    overlay.style.display = 'flex';
    startSubTotalWatcher();
  };

  window.closePaymentPopup = function () {
    overlay.style.display = 'none';
    // clear active input
    activeInput = null;
    if (subWatchInterval) {
      clearInterval(subWatchInterval);
      subWatchInterval = null;
    }
  };

  // Optional: if the page updates the subtotal and you want the popup to reflect that while open,
  // you can call updateTotals() from your cart code when subtotal changes.
});
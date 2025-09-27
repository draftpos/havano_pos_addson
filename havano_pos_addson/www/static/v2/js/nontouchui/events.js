// Bind event listeners
function bindEvents() {
    btnAddRow.addEventListener('click', addNewRow);
    btnPayment.addEventListener('click',  showPaymentDialog);
    
    // Quantity popup events
    quantityPopupConfirm.addEventListener('click', applyQuantityFromPopup);
    quantityPopupCancel.addEventListener('click', hideQuantityPopup);
    quantityPopupOverlay.addEventListener('click', hideQuantityPopup);
    
    // Number pad events
    document.querySelectorAll('.ha-numpad-btn[data-value]').forEach(button => {
        button.addEventListener('click', () => {
            handleNumpadInput(button.getAttribute('data-value'));
        });
    });
    
    document.querySelectorAll('.ha-sidebar-numpad-btn[data-value]').forEach(button => {
        button.addEventListener('click', () => {
            handleNumpadInput(button.getAttribute('data-value'));
        });
    });
    
    quantityClear.addEventListener('click', () => {
        handleNumpadInput('clear');
    });
    
    quantityBackspace.addEventListener('click', () => {
        handleNumpadInput('backspace');
    });
    
    // Handle Enter key in quantity popup
    document.addEventListener('keydown', function(e) {
        if (quantityPopup.classList.contains('active')) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyQuantityFromPopup();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideQuantityPopup();
            } else if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                handleNumpadInput(e.key);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                handleNumpadInput('backspace');
            } else if (e.key === 'Delete' || e.key === 'Clear') {
                e.preventDefault();
                handleNumpadInput('clear');
            }
        }
    });
    
    // Event delegation for dynamic elements
    document.addEventListener('click', function(e) {
        // Item search for both name and code
        if (e.target.classList.contains('ha-item-input') || 
            e.target.classList.contains('item-code')) {
            showItemSearchDropdown(e.target);
            activeItemField = e.target;
        } 
        // Delete item
        else if (e.target.closest('.btn-danger')) {
            removeItem(e.target.closest('.btn-danger'));
        }
        // Hide dropdown when clicking elsewhere
        else if (!e.target.closest('.ha-item-search-dropdown')) {
            searchDropdown.style.display = 'none';
            isInSearchMode = false;
        }
        
        // Function keys
        if (e.target.closest('.ha-function-key')) {
            const action = e.target.closest('.ha-function-key').dataset.action;
            handleFunctionKey(action);
        }
        
        // Set active row when clicking on any row element
        if (e.target.closest('tr')) {
            const rows = itemsTableBody.querySelectorAll('tr');
            rows.forEach(row => row.classList.remove('item-row-active'));
            e.target.closest('tr').classList.add('item-row-active');
        }
    });
    
    // Input events for both item code and name search
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-code') || 
            e.target.classList.contains('ha-item-input')) {
            const searchTerm = e.target.value.trim();
            currentSearchTerm = searchTerm;
            
            if (searchTerm.length > 1) {
                searchItems(searchTerm, e.target.classList.contains('item-code') ? 'code' : 'name');
                positionDropdown(e.target);
            } else {
                searchDropdown.style.display = 'none';
                isInSearchMode = false;
            }
        }
    });
    
    // Change events for quantity and rate
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('item-qty') || 
            e.target.classList.contains('item-rate')) {
            updateItemAmount(e.target);
        }
    });
    
    // Focus events for form fields
    document.addEventListener('focusin', function(e) {
        if (e.target.matches('input, select')) {
            // Remove active class from all fields
            document.querySelectorAll('input, select').forEach(field => {
                field.classList.remove('form-field-active');
            });
            
            // Add active class to current field
            e.target.classList.add('form-field-active');
            
            // Update current focus index
            const fields = getFocusableFields();
            currentFocusIndex = fields.indexOf(e.target);
            
            // If it's an item field, set as active
            if (e.target.classList.contains('ha-item-input') || 
                e.target.classList.contains('item-code')) {
                activeItemField = e.target;
            }
            
            // Set active row when focusing on a field in a row
            if (e.target.closest('tr')) {
                const rows = itemsTableBody.querySelectorAll('tr');
                rows.forEach(row => row.classList.remove('item-row-active'));
                e.target.closest('tr').classList.add('item-row-active');
            }
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Skip if quantity popup is active (handled separately)
        if (quantityPopup.classList.contains('active')) return;
        
        // Function keys
        if (e.key === 'F1' || e.key === 'F2') {
            e.preventDefault();
            showPaymentDialog();
        }
        else if (e.key === 'F5') {
            e.preventDefault();
            handleFunctionKey('quantity');
        }
        else if (e.key === 'F7') handleFunctionKey('discount');
        else if (e.key === 'F10') handleFunctionKey('options');
        else if (e.key === 'F12') handleFunctionKey('return');
        
        // Enter key to move to next field/row or confirm selection
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            
            // Handle Enter in search dropdown
            if (searchDropdown.style.display === 'block') {
                e.preventDefault();
                const activeResult = searchDropdown.querySelector('.ha-search-result-active');
                if (activeResult) {
                    activeResult.click();
                    searchDropdown.style.display = 'none';
                    isInSearchMode = false;

                    if (allSettings.length > 0 && allSettings[0].ha_on_pres_enter === "nextrow") {
                        addNewRow();
                    } else {
                        moveToNextField();
                    }
                }
            }
            // Handle Enter in item code field - FIRST ENTER SHOWS SEARCH
            else if (activeElement.classList.contains('item-code')) {
                e.preventDefault();
                const row = activeElement.closest('tr');
                const code = activeElement.value.trim();
                currentSearchTerm = code;
                
                if (code) {
                    // If we're already in search mode, select the first result
                    if (isInSearchMode) {
                        const firstResult = searchDropdown.querySelector('.ha-search-result-item');
                        if (firstResult) {
                            firstResult.click();
                            searchDropdown.style.display = 'none';
                            isInSearchMode = false;
                            
                            // Move to rate field after selection
                            row.querySelector('.item-rate').focus();
                            row.querySelector('.item-rate').select();
                        }
                    } else {
                        // First Enter - show search results
                        showItemSearchDropdown(activeElement);
                        searchItems(code, 'code');
                        isInSearchMode = true;
                    }
                } else {
                    // If empty, show all items
                    showItemSearchDropdown(activeElement);
                    displaySearchResults(allItems.slice(0, 10));
                    isInSearchMode = true;
                }
            }
            // Handle Enter in item name field - FIRST ENTER SHOWS SEARCH
            else if (activeElement.classList.contains('ha-item-input') && 
                     !activeElement.classList.contains('item-code')) {
                e.preventDefault();
                const row = activeElement.closest('tr');
                const name = activeElement.value.trim();
                currentSearchTerm = name;
                
                if (isInSearchMode) {
                    // Second Enter - select first result
                    const firstResult = searchDropdown.querySelector('.ha-search-result-item');
                    if (firstResult) {
                        firstResult.click();
                        searchDropdown.style.display = 'none';
                        isInSearchMode = false;
                        
                        // Move to rate field after selection
                        row.querySelector('.item-rate').focus();
                        row.querySelector('.item-rate').select();
                    }
                } else {
                    // First Enter - show search results
                    showItemSearchDropdown(activeElement);
                    searchItems(name, 'name');
                    isInSearchMode = true;
                }
            }
            // Handle Enter in rate field
            else if (activeElement.classList.contains('item-rate')) {
                e.preventDefault();
                const row = activeElement.closest('tr');
                row.querySelector('.item-qty').focus();
                row.querySelector('.item-qty').select();
            }
            // Handle Enter in quantity field
            else if (activeElement.classList.contains('item-qty')) {
                e.preventDefault();
                
                const row = activeElement.closest('tr');
                const nextRow = row.nextElementSibling;
                
                if (nextRow) {
                    nextRow.querySelector('.item-code').focus();
                    nextRow.querySelector('.item-code').select();
                } else {
                    // If no next row, add new row and focus on item code
                    addNewRow();
                    const newRow = itemsTableBody.lastChild;
                    newRow.querySelector('.item-code').focus();
                    newRow.querySelector('.item-code').select();
                }
            }
            // Handle Enter in customer or price list fields
            else if (activeElement === customerSelect || activeElement === priceListSelect) {
                e.preventDefault();
                moveToNextField();
            }
        }
        
        // Tab key to move to next field
        if (e.key === 'Tab') {
            e.preventDefault();
            moveToNextField();
        }
        
        // Shift+Tab to move to previous field
        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            moveToPreviousField();
        }
        
        // Escape key to close dropdown and exit search mode
        if (e.key === 'Eescape') {
            searchDropdown.style.display = 'none';
            isInSearchMode = false;
            
            // If we were in an item field, keep focus there
            if (activeItemField) {
                activeItemField.focus();
                activeItemField.select();
            }
        }
        
        // Arrow keys in search dropdown
        if (searchDropdown.style.display === 'block') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateSearchResults(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateSearchResults(-1);
            }
        }
        // Arrow keys to navigate between items in the table
        else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && 
                 document.activeElement.closest('tr') && 
                 !document.activeElement.classList.contains('btn-danger')) {
            e.preventDefault();
            navigateTableRows(e.key === 'ArrowDown' ? 1 : -1);
        }
    });
    
    // Logout button
    document.getElementById('btnLogout').addEventListener('click', function() {
        window.location.href = '/logout';
    });
    
    // Handle window resize to reposition dropdown
    window.addEventListener('resize', function() {
        if (searchDropdown.style.display === 'block' && activeItemField) {
            positionDropdown(activeItemField);
        }
    });
}
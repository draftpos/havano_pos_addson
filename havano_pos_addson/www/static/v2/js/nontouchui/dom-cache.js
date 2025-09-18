// DOM elements
let itemsTableBody, totalAmount, subTotal, btnAddRow, searchDropdown;
let customerSelect, priceListSelect, btnPayment, loadingOverlay;
let tableContainer, quantityPopup, quantityPopupOverlay, quantityDisplay;
let quantityPopupConfirm, quantityPopupCancel, quantityClear, quantityBackspace;

// Cache DOM elements
function cacheDOM() {
    itemsTableBody = document.getElementById('itemsTableBody');
    totalAmount = document.getElementById('totalAmount');
    subTotal = document.getElementById('sub_total');
    btnAddRow = document.getElementById('btnAddRow');
    searchDropdown = document.getElementById('searchDropdown');
    customerSelect = document.getElementById('customer');
    priceListSelect = document.getElementById('pricelist');
    btnPayment = document.getElementById('btnPayment');
    loadingOverlay = document.getElementById('loadingOverlay');
    tableContainer = document.querySelector('.table-responsive');
    quantityPopup = document.getElementById('quantityPopup');
    quantityPopupOverlay = document.getElementById('quantityPopupOverlay');
    quantityDisplay = document.getElementById('quantityDisplay');
    quantityPopupConfirm = document.getElementById('quantityPopupConfirm');
    quantityPopupCancel = document.getElementById('quantityPopupCancel');
    quantityClear = document.getElementById('quantityClear');
    quantityBackspace = document.getElementById('quantityBackspace');
}
// DOM elements
let itemsTableBody, totalAmount, subTotal, btnAddRow, searchDropdown;
let customerSelect, priceListSelect, btnPayment, loadingOverlay;
let quantityPopup, quantityPopupOverlay, quantityDisplay;
let quantityPopupConfirm, quantityPopupCancel, quantityClear, quantityBackspace;
let itemGroupsContainer, groupItemsContainer;
let quantityDisplaySidebar, quantitySidebarConfirm, quantitySidebarCancel;
let quantitySidebarClear, quantitySidebarBackspace;
let clearCartBtn;

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
    quantityPopup = document.getElementById('quantityPopup');
    quantityPopupOverlay = document.getElementById('quantityPopupOverlay');
    quantityDisplay = document.getElementById('quantityDisplay');
    quantityPopupConfirm = document.getElementById('quantityPopupConfirm');
    quantityPopupCancel = document.getElementById('quantityPopupCancel');
    quantityClear = document.getElementById('quantityClear');
    quantityBackspace = document.getElementById('quantityBackspace');
    itemGroupsContainer = document.getElementById('itemGroupsContainer');
    groupItemsContainer = document.getElementById('groupItemsContainer');
    quantityDisplaySidebar = document.getElementById('quantityDisplaySidebar');
    quantitySidebarConfirm = document.getElementById('quantitySidebarConfirm');
    quantitySidebarCancel = document.getElementById('quantitySidebarCancel');
    quantitySidebarClear = document.getElementById('quantitySidebarClear');
    quantitySidebarBackspace = document.getElementById('quantitySidebarBackspace');
    clearCartBtn = document.getElementById('clearCartBtn');
}
alert("heeeeeeelo");
const btnAddRow = document.getElementById('btnAddRow');

function addNewRow() {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="ha-relative">
            <input type="text" class="item-code form-control ha-item-input" placeholder="Type item code">
        </td>
        <td>
            <input type="text" class="item-name form-control ha-item-input" placeholder="Click to see all items">
        </td>
        <td>
            <input type="text" class="item-uom form-control" value="Nos" readonly>
        </td>
        <td>
            <input type="number" class="item-qty form-control" value="1" min="1">
        </td>
        <td>
            <input type="number" class="item-rate form-control" value="0.00" step="0.01">
        </td>
        <td>
            <input type="text" class="item-amount form-control" value="0.00" readonly>
        </td>
        <td class="text-center">
            <button class="btn btn-sm btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    itemsTableBody.appendChild(newRow);
    
    // Auto-focus on the new item code field
    setTimeout(() => {
        // const itemCodeInput = newRow.querySelector('.item-code');
        // itemCodeInput.focus();
        // itemCodeInput.select();
        
        // Update current focus index
        // const fields = getFocusableFields();
        // currentFocusIndex = fields.indexOf(itemCodeInput);
    }, 100);
}

btnAddRow.addEventListener('click', addNewRow);
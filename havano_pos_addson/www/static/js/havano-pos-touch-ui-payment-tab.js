    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeBtn');
    const openModalBtn = document.getElementById('btnPayment');

    // Function to open the modal
    function openModal() {
        overlay.style.visibility = 'visible';
    }

    // Function to close the modal
    function closeModal() {
        overlay.style.visibility = 'hidden';
    }

    // Open modal button event listener
    openModalBtn.addEventListener('click', openModal);

    // Close button event listener
    closeBtn.addEventListener('click', closeModal);

    // Payment interface logic
    let currentAmount = 0;
    let selectedPayment = null;

    function selectPayment(element) {
        const methods = document.querySelectorAll('.ha-pos-payment-method');
        methods.forEach(method => method.classList.remove('ha-pos-payment-active-payment'));
        
        element.classList.add('ha-pos-payment-active-payment');
        selectedPayment = element;

        if (currentAmount > 0) {
            const amountElement = element.querySelector('.ha-pos-payment-amount');
            amountElement.textContent = currentAmount.toFixed(2);
            updateChange();
        }
    }

    function appendNumber(number) {
        let amountStr = currentAmount.toString();
        if (amountStr.includes('.')) {
            const decimalPart = amountStr.split('.')[1];
            if (decimalPart.length < 2) {
                amountStr += number.toString();
            }
        } else {
            amountStr += number.toString();
        }
        currentAmount = parseFloat(amountStr);
        updateDisplay();
    }

    function setAmount(amount) {
        currentAmount = amount;
        updateDisplay();
    }

    function toggleSign() {
        currentAmount = -currentAmount;
        updateDisplay();
    }

    function backspace() {
        let amountStr = currentAmount.toString();
        if (amountStr.length > 1) {
            amountStr = amountStr.slice(0, -1);
            currentAmount = amountStr ? parseFloat(amountStr) : 0;
        } else {
            currentAmount = 0;
        }
        updateDisplay();
    }

    function clearAmount() {
        currentAmount = 0;
        updateDisplay();
    }

    function cancelPayment() {
        currentAmount = 0;
        selectedPayment = null;

        const methods = document.querySelectorAll('.ha-pos-payment-method');
        methods.forEach(method => {
            method.classList.remove('ha-pos-payment-active-payment');
            const amountElement = method.querySelector('.ha-pos-payment-amount');
            amountElement.textContent = '0.00';
        });

        updateDisplay();
    }

    function updateDisplay() {
        document.querySelector('.ha-pos-payment-amount-due').textContent = currentAmount.toFixed(2);
        if (selectedPayment) {
            const amountElement = selectedPayment.querySelector('.ha-pos-payment-amount');
            amountElement.textContent = currentAmount.toFixed(2);
        }
        updateChange();
    }

    function updateChange() {
        const totalDue = 50.00; // Static for this example
        const change = currentAmount - totalDue;
        document.querySelector('.ha-pos-payment-transaction-summary .ha-pos-payment-summary-value:last-child').textContent = change.toFixed(2);
    }

    function savePayment() {
        if (!selectedPayment) {
            alert('Please select a payment method first');
            return;
        }

        if (currentAmount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        alert(`Payment of $${currentAmount.toFixed(2)} processed successfully!`);
        cancelPayment(); // Reset the interface
    }

    function printReceipt() {
        alert('Printing receipt...');
    }

    document.addEventListener('keydown', function(event) {
        if (event.key >= '0' && event.key <= '9') {
            appendNumber(parseInt(event.key));
        }
        if (event.key === 'F3') {
            event.preventDefault();
            printReceipt();
        }
        if (event.key === 'Escape') {
            cancelPayment();
        }
        if (event.key === 'Backspace') {
            backspace();
        }
    });
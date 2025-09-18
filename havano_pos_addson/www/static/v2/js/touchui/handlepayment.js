function openPaymentPopup() {
    console.log("handle function onPaymentPopUp");
    let total_amount = document.getElementById("sub_total").value;
    let pop_up_total_amount = document.getElementById("ha-pos-payment-pop-total-amount");
    let pop_up_total_cash = document.getElementById("ha-pos-payment-method-cash-amount");
    pop_up_total_amount.innerHTML = total_amount;
    pop_up_total_cash.innerHTML = total_amount;

    let all_popup_nums = document.querySelectorAll(".ha-pos-payment-pop-btn-num");
    all_popup_nums.forEach(a = () => {
        console.log("add event listetner here")
    })

    document.getElementById("paymentOverlay").style.display = "flex";
}
function closePaymentPopup() {
    document.getElementById("paymentOverlay").style.display = "none";
}


function handlePayemt(){
    alert(hello);
}
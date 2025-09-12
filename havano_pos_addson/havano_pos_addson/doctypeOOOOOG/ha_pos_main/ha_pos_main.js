


// We only want this logic to run on the specific page.
if (window.location.pathname.includes('/app/ha-pos-main')) {
    alert(window.location.pathname );
    alert("hhhh9999999999999900000000000000009h");
    function removePageHeader(h) {
        const headers = document.getElementsByClassName(h);
        for (let i = 0; i < headers.length; i++) {
            headers[i].style.setProperty("display", "none", "important");
        }
    }

    // Create an observer to watch for changes in the DOM.
    const observer = new MutationObserver((mutationsList, observer) => {
        const headers = document.getElementsByClassName("page-head");
        if (headers.length > 0) {
            removePageHeader("sticky-top");
            // removePageHeader("page-head");
            removePageHeader("layout-side-section");
            observer.disconnect();
        }
    });

    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
}
const taxSwitch = document.getElementById("switchCheckDefault");

taxSwitch.addEventListener("click", () => {
    const priceElements = document.querySelectorAll(".price-info");

    priceElements.forEach(el => {
        const basePrice = parseFloat(el.dataset.basePrice);
        if (isNaN(basePrice)) return;

        if (taxSwitch.checked) {
            const taxed = Math.round(basePrice * 1.18).toLocaleString("en-IN");
            el.textContent = `After Tax: ₹${taxed} / night`;
        } else {
            const original = basePrice.toLocaleString("en-IN");
            el.textContent = `₹${original} / night`;
        }
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const reorderBtn = document.getElementById("toggleReorderBtn");
    const reorderBox = document.getElementById("reorderBox");
    const container = document.getElementById("sortable-container");
    const orderField = document.getElementById("imageOrderField");

    if (reorderBtn && reorderBox) {
        reorderBtn.addEventListener("click", () => {
            reorderBox.style.display = reorderBox.style.display === "none" ? "block" : "none";
        });
    }

    if (container && orderField) {
        new Sortable(container, {
            animation: 150,
            fallbackTolerance: 8, // start dragging after 8px movement
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: () => {
                const filenames = Array.from(container.children).map(child =>
                    child.dataset.filename
                );
                orderField.value = filenames.join(",");
            }
        });

        // Populate initial order
        const initialOrder = Array.from(container.children).map(child =>
            child.dataset.filename
        );
        orderField.value = initialOrder.join(",");
    }
});

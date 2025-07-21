document.addEventListener("DOMContentLoaded", () => {
    const imageElement = document.getElementById("carousel-image");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const checkbox = document.getElementById("deleteImageCheckbox");
    const openModalBtn = document.getElementById("openDeleteModal");
    const deleteImagesField = document.getElementById("deleteImagesField");

    const images = JSON.parse(imageElement.dataset.images);  // ✅ Keep only one declaration

    if (!images || images.length === 0) {
        console.warn("No images found for carousel.");
        return;
    }

    if (!checkbox) {
        console.error("Checkbox not found!");
        return;
    } else {
        console.log("Checkbox found and hooked!");
    }

    let currentIndex = 0;
    const deleteSet = new Set();

    function updateImage() {
        if (!images[currentIndex]) return;  // ✅ Safety check
        const { url, filename } = images[currentIndex];
        imageElement.src = url;
        checkbox.checked = deleteSet.has(filename);
        checkbox.value = filename;
    }

    checkbox.addEventListener("change", () => {
        const filename = images[currentIndex].filename;
        if (checkbox.checked) {
            deleteSet.add(filename);
        } else {
            deleteSet.delete(filename);
        }
        console.log("Current deleteSet:", Array.from(deleteSet));
    });

    openModalBtn.addEventListener("click", () => {
        const filenamesToDelete = Array.from(deleteSet);
        deleteImagesField.value = filenamesToDelete.join(",");
        const modal = new bootstrap.Modal(document.getElementById("confirmDeleteModal"));
        modal.show();
    });

    document.getElementById("editForm").addEventListener("submit", (e) => {
        const filenamesToDelete = Array.from(deleteSet);
        deleteImagesField.value = filenamesToDelete.join(",");
        console.log("🚀 [Frontend] deleteImagesField:", deleteImagesField.value);
    });

    prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateImage();
    });

    nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        currentIndex = (currentIndex + 1) % images.length;
        updateImage();
    });

    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    confirmDeleteBtn.addEventListener("click", () => {
        const filenamesToDelete = Array.from(deleteSet);
        deleteImagesField.value = filenamesToDelete.join(",");

        deleteSet.clear();  // ✅ Clear selection after submission

        document.getElementById("editForm").submit();
    });

    updateImage();  // ✅ Initial render
});

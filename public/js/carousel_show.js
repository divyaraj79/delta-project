// /public/js/carousel-show.js

document.addEventListener("DOMContentLoaded", () => {
    const imageElement = document.getElementById("carousel-image");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    const images = JSON.parse(imageElement.dataset.images); // array of URLs
    if (!images || images.length === 0) return;

    let currentIndex = 0;

    function updateImage() {
        imageElement.src = images[currentIndex];
    }

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

    updateImage();
});

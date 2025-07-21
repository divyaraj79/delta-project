const form = document.querySelector('form');
const fileInput = document.querySelector('input[type="file"]');

form.addEventListener('submit', function (e) {
    const files = fileInput.files;

    if (files.length === 0) {
        alert('Please upload at least one image.');
        e.preventDefault();
    } else if (files.length > 5) {
        alert('You can upload a maximum of 5 images.');
        e.preventDefault();
    }
});
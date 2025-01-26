// account.js

// Select DOM elements
const deleteBtn = document.getElementById('delete-btn');
const deleteModal = document.getElementById('deleteModal');
const closeModalBtns = document.querySelectorAll('[data-bs-dismiss="modal"]');

// Show modal on delete button click
deleteBtn.addEventListener('click', () => {
    deleteModal.classList.add('active');
});

// Close modal on cancel button or backdrop click
closeModalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        deleteModal.classList.remove('active');
    });
});

// Close modal on clicking outside the dialog
window.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
        deleteModal.classList.remove('active');
    }
});

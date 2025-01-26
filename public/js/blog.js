document.addEventListener('DOMContentLoaded', function () {
    // Get references to the like and dislike buttons
    const likeButton = document.getElementById('like-blog');
    const dislikeButton = document.getElementById('dislike-blog');
    const likeCount = document.getElementById('like-count');
    const dislikeCount = document.getElementById('dislike-count');
    const blogId = likeButton.getAttribute('data-blog-id');
    
    // Event listener for liking a blog
    if (likeButton) {
        likeButton.addEventListener('click', function () {
            // Send AJAX request to server for liking the blog
            fetch(`/blog/${blogId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update like count on success
                        likeCount.textContent = data.likes;
                        console.log('Blog liked successfully.');
                        window.location.reload(); // Reload the page
                    } else {
                        console.log('Failed to like the blog. Please try again.');
                        window.location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    console.log('An error occurred. Please try again.');
                });
        });
    }

    // Event listener for disliking a blog
    if (dislikeButton) {
        dislikeButton.addEventListener('click', function () {
            const blogId = dislikeButton.getAttribute('data-blog-id');

            // Send AJAX request to server for disliking the blog
            fetch(`/blog/${blogId}/dislike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update dislike count on success
                        dislikeCount.textContent = data.dislikes;
                        console.log('Blog disliked successfully.');
                        window.location.reload(); // Reload the page
                    } else {
                        console.log('Failed to dislike the blog. Please try again.');
                        window.location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    console.log('An error occurred. Please try again.');
                });
        });
    }

    // Like button functionality for comments
    const commentLikeButtons = document.querySelectorAll('.like-comment');
    commentLikeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const commentId = button.getAttribute('data-comment-id');
            const likeSpan = button.querySelector('span');

            // Send AJAX request to server for liking the comment
            fetch(`${blogId}/comments/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update like count on success
                        likeSpan.textContent = data.likes;
                        console.log('Comment liked successfully.');
                        window.location.reload(); // Reload the page
                    } else {
                        console.log('Failed to like the comment. Please try again.');
                        window.location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    console.log('An error occurred. Please try again.');
                });
        });
    });

    // Delete blog functionality
    const deleteBlogButton = document.getElementById('delete-blog');
    if (deleteBlogButton) {
        deleteBlogButton.addEventListener('click', function () {
            // Confirm deletion
            const confirmDelete = confirm('Are you sure you want to delete this blog?');
            if (confirmDelete) {
                fetch(`/blog/${blogId}/delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log('Blog deleted successfully.');
                            window.location.href = '/'; // Redirect to home page after deletion
                        } else {
                            console.log('Failed to delete the blog. Please try again.');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        console.log('An error occurred. Please try again.');
                    });
            }
            window.location.href = '/'; // Redirects to the homepage

        });
    }

    // Delete comment functionality
    const deleteCommentButtons = document.querySelectorAll('.delete-comment');
    deleteCommentButtons.forEach(button => {
        button.addEventListener('click', function () {
            const commentId = button.getAttribute('data-comment-id');

            // Confirm deletion
            const confirmDelete = confirm('Are you sure you want to delete this comment?');
            if (confirmDelete) {
                fetch(`/blog/${blogId}/comments/${commentId}/delete`, {
                    method: 'POST',
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log('Comment deleted successfully.');
                            window.location.reload(); // Reload the page after deletion
                        } else {
                            console.log('Failed to delete the comment. Please try again.');
                            window.location.reload(); // Reload the page after deletion
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        console.log('An error occurred. Please try again.');
                    });
            }
        });
    });
});

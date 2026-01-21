const API_BASE_URL = 'http://localhost:3000';


document.addEventListener('DOMContentLoaded', () => {
    loadBlogs();
    

    document.getElementById('blog-form').addEventListener('submit', handleFormSubmit);
});


async function loadBlogs() {
    const blogPostsContainer = document.getElementById('blog-posts');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    blogPostsContainer.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/blogs`);
        const result = await response.json();

        loading.style.display = 'none';

        if (!result.success) {
            throw new Error(result.message || 'Failed to load blog posts');
        }

        if (result.data.length === 0) {
            blogPostsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No blog posts yet</h3>
                    <p>Create your first blog post using the form above!</p>
                </div>
            `;
            return;
        }

        result.data.forEach(post => {
            const postElement = createBlogPostElement(post);
            blogPostsContainer.appendChild(postElement);
        });
    } catch (error) {
        loading.style.display = 'none';
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = 'block';
        console.error('Error loading blogs:', error);
    }
}


function createBlogPostElement(post) {
    const div = document.createElement('div');
    div.className = 'blog-post';
    div.id = `post-${post._id}`;

    const createdAt = new Date(post.createdAt).toLocaleString();
    const updatedAt = post.updatedAt ? new Date(post.updatedAt).toLocaleString() : null;
    const updatedText = updatedAt && updatedAt !== createdAt ? ` • Updated: ${updatedAt}` : '';

    div.innerHTML = `
        <h3>${escapeHtml(post.title)}</h3>
        <div class="meta">
            <span class="author">By: ${escapeHtml(post.author)}</span>
            <span>Created: ${createdAt}${updatedText}</span>
        </div>
        <div class="body">${escapeHtml(post.body)}</div>
        <div class="actions">
            <button class="btn-edit" onclick="editPost('${post._id}')"> Edit</button>
            <button class="btn-delete" onclick="deletePost('${post._id}')"> Delete</button>
        </div>
    `;

    return div;
}


async function handleFormSubmit(e) {
    e.preventDefault();

    const postId = document.getElementById('post-id').value;
    const title = document.getElementById('title').value.trim();
    const body = document.getElementById('body').value.trim();
    const author = document.getElementById('author').value.trim() || 'Anonymous';


    if (!title || !body) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
        let response;
        if (postId) {

            response = await fetch(`${API_BASE_URL}/blogs/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, body, author })
            });
        } else {

            response = await fetch(`${API_BASE_URL}/blogs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, body, author })
            });
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Operation failed');
        }

        showMessage(result.message || (postId ? 'Blog post updated successfully!' : 'Blog post created successfully!'), 'success');
        resetForm();
        loadBlogs();
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
        console.error('Error submitting form:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}


async function editPost(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/${id}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to load blog post');
        }

        const post = result.data;
        document.getElementById('post-id').value = post._id;
        document.getElementById('title').value = post.title;
        document.getElementById('body').value = post.body;
        document.getElementById('author').value = post.author;

        document.getElementById('form-title').textContent = 'Edit Blog Post';
        document.getElementById('submit-btn').textContent = 'Update Post';
        document.getElementById('cancel-btn').style.display = 'inline-block';

        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
        console.error('Error loading post for edit:', error);
    }
}

async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this blog post?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to delete blog post');
        }

        showMessage('Blog post deleted successfully!', 'success');
        loadBlogs();
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
        console.error('Error deleting post:', error);
    }
}


function resetForm() {
    document.getElementById('blog-form').reset();
    document.getElementById('post-id').value = '';
    document.getElementById('form-title').textContent = 'Create New Blog Post';
    document.getElementById('submit-btn').textContent = 'Create Post';
    document.getElementById('cancel-btn').style.display = 'none';
}

function showMessage(message, type) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.className = type === 'error' ? 'error-message' : 'success-message';
    errorMessage.style.display = 'block';


    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

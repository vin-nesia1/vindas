// Form Handler for DOMAIN FREE VIN NESIA
document.addEventListener('DOMContentLoaded', function() {
    const domainForm = document.getElementById('domain-form');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!domainForm || !submitBtn) {
        console.log('Form elements not found on this page');
        return;
    }

    // Form submission handler
    domainForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Check if user is authenticated
        if (typeof window.authModule === 'undefined') {
            showAlert('Authentication module not loaded', 'error');
            return;
        }

        const user = await window.authModule.getCurrentUser();
        if (!user) {
            showAlert('Please login first to submit the form', 'warning');
            window.authModule.showLoginModal();
            return;
        }

        // Get form data
        const formData = new FormData(domainForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            purpose: formData.get('purpose'),
            platform_link: formData.get('platform_link'),
            user_id: user.id
        };

        // Validate form data
        const validation = validateFormData(data);
        if (!validation.isValid) {
            showAlert(validation.message, 'error');
            return;
        }

        // Disable submit button and show loading state
        setSubmitLoading(true);

        try {
            // Store to Supabase database
            const supabaseResult = await storeToSupabase(data);
            if (!supabaseResult.success) {
                throw new Error(supabaseResult.error);
            }

            // Send to admin panel API
            const apiResult = await sendToAdminAPI(data);
            if (!apiResult.success) {
                console.warn('Admin API failed:', apiResult.error);
                // Don't throw error here - Supabase storage succeeded
            }

            // Show success message
            showAlert('Application submitted successfully! Check your dashboard for status updates.', 'success');
            
            // Reset form
            domainForm.reset();
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Form submission error:', error);
            showAlert(`Submission failed: ${error.message}`, 'error');
        } finally {
            setSubmitLoading(false);
        }
    });

    // Real-time form validation
    const inputs = domainForm.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
});

// Validate form data
function validateFormData(data) {
    // Check required fields
    if (!data.name || data.name.trim().length < 2) {
        return {
            isValid: false,
            message: 'Please enter a valid name (at least 2 characters)'
        };
    }

    if (!data.email || !isValidEmail(data.email)) {
        return {
            isValid: false,
            message: 'Please enter a valid email address'
        };
    }

    if (!data.purpose) {
        return {
            isValid: false,
            message: 'Please select a purpose for your domain'
        };
    }

    if (!data.platform_link || !isValidURL(data.platform_link)) {
        return {
            isValid: false,
            message: 'Please enter a valid platform URL'
        };
    }

    // Additional validations
    if (data.name.trim().length > 100) {
        return {
            isValid: false,
            message: 'Name is too long (maximum 100 characters)'
        };
    }

    return { isValid: true };
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';

    switch (field.name) {
        case 'name':
            if (!value || value.length < 2) {
                isValid = false;
                message = 'Name must be at least 2 characters';
            } else if (value.length > 100) {
                isValid = false;
                message = 'Name is too long (max 100 characters)';
            }
            break;

        case 'email':
            if (!value || !isValidEmail(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
            break;

        case 'purpose':
            if (!value) {
                isValid = false;
                message = 'Please select a purpose';
            }
            break;

        case 'platform_link':
            if (!value || !isValidURL(value)) {
                isValid = false;
                message = 'Please enter a valid URL';
            }
            break;
    }

    if (!isValid) {
        showFieldError(field, message);
    } else {
        clearFieldError(field);
    }

    return isValid;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('border-red-500');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-400 text-sm mt-1';
    errorDiv.textContent = message;
    errorDiv.setAttribute('data-error-for', field.name);
    
    field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('border-red-500');
    
    const existingError = field.parentNode.querySelector(`[data-error-for="${field.name}"]`);
    if (existingError) {
        existingError.remove();
    }
}

// Store data to Supabase
async function storeToSupabase(data) {
    try {
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase client not available');
        }

        const { data: result, error } = await supabase
            .from('form_data')
            .insert([{
                name: data.name,
                email: data.email,
                purpose: data.purpose,
                platform_link: data.platform_link,
                user_id: data.user_id,
                status: 'pending'
            }]);

        if (error) {
            throw error;
        }

        return { success: true, data: result };
    } catch (error) {
        console.error('Supabase storage error:', error);
        return { success: false, error: error.message };
    }
}

// Send data to Admin Panel API
async function sendToAdminAPI(data) {
    try {
        const response = await fetch('/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Admin API error:', error);
        return { success: false, error: error.message };
    }
}

// Set submit button loading state
function setSubmitLoading(loading) {
    const submitBtn = document.getElementById('submit-btn');
    if (!submitBtn) return;

    if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="loading-spinner mr-2"></span>
            Submitting...
        `;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <span>Submit Application</span>
            <i class="fas fa-paper-plane"></i>
        `;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function showAlert(message, type = 'info') {
    if (typeof window.authModule !== 'undefined' && window.authModule.showAlert) {
        window.authModule.showAlert(message, type);
    } else {
        // Fallback alert
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message);
    }
}

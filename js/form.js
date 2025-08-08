const supabase = Supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

document.getElementById('domain-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formMessage = document.getElementById('form-message');
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        purpose: document.getElementById('purpose').value,
        platform_link: document.getElementById('platform_link').value,
    };

    try {
        const response = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (response.ok) {
            formMessage.innerHTML = '<p class="text-green-400">Submission successful!</p>';
            document.getElementById('domain-form').reset();
        } else {
            formMessage.innerHTML = `<p class="text-red-400">Error: ${result.error}</p>`;
        }
    } catch (error) {
        formMessage.innerHTML = '<p class="text-red-400">Error submitting form.</p>';
    }
});

const supabase = Supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

async function loadSubmissions() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('form_data')
        .select('*')
        .eq('email', user.email);

    if (error) {
        console.error('Error fetching submissions:', error);
        return;
    }

    const tableBody = document.getElementById('submissions-table');
    tableBody.innerHTML = '';
    data.forEach((submission) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${submission.name}</td>
            <td>${submission.email}</td>
            <td>${submission.purpose}</td>
            <td><a href="${submission.platform_link}" class="text-purple-400">${submission.platform_link}</a></td>
            <td>${submission.status}</td>
            <td>${new Date(submission.created_at).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', loadSubmissions);

const supabase = Supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
}

async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
}

async function signInWithFacebook() {
    await supabase.auth.signInWithOAuth({ provider: 'facebook' });
}

async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
}

supabase.auth.onAuthStateChange((event, session) => {
    const authSection = document.getElementById('auth-section');
    const form = document.getElementById('domain-form') || document.getElementById('submissions');
    if (session) {
        authSection.classList.add('hidden');
        if (form) form.classList.remove('hidden');
    } else {
        authSection.classList.remove('hidden');
        if (form) form.classList.add('hidden');
    }
});

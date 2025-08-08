export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, purpose, platform_link } = req.body;

    if (!name || !email || !purpose || !platform_link) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const response = await fetch(process.env.ADMIN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ADMIN_API_KEY,
            },
            body: JSON.stringify({ name, email, purpose, platform_link }),
        });

        if (!response.ok) {
            throw new Error('Failed to send data to Admin Panel');
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        await supabase.from('form_data').insert([{ name, email, purpose, platform_link }]);

        return res.status(200).json({ message: 'Submission successful' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

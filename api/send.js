// Vercel Serverless Function for DOMAIN FREE VIN NESIA
// File: api/send.js

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Only POST requests are accepted.'
        });
    }

    try {
        // Validate environment variables
        const adminApiUrl = process.env.ADMIN_API_URL;
        const adminApiKey = process.env.ADMIN_API_KEY;

        if (!adminApiUrl || !adminApiKey) {
            console.error('Missing environment variables:', {
                hasAdminApiUrl: !!adminApiUrl,
                hasAdminApiKey: !!adminApiKey
            });
            
            return res.status(500).json({
                success: false,
                error: 'Server configuration error. Please contact administrator.'
            });
        }

        // Validate request body
        const { name, email, purpose, platform_link, user_id } = req.body;

        if (!name || !email || !purpose || !platform_link) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields. Please provide name, email, purpose, and platform_link.'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format.'
            });
        }

        // Validate URL format
        try {
            const url = new URL(platform_link);
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Invalid protocol');
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid platform URL format.'
            });
        }

        // Prepare data for admin API
        const adminData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            purpose: purpose.trim(),
            platform_link: platform_link.trim(),
            user_id: user_id || null,
            submitted_at: new Date().toISOString(),
            source: 'vinnesia_domain_form'
        };

        // Log submission (without sensitive data)
        console.log('Processing domain application:', {
            name: adminData.name,
            email: adminData.email,
            purpose: adminData.purpose,
            timestamp: adminData.submitted_at
        });

        // Send to Admin Panel API
        const adminResponse = await fetch(adminApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': adminApiKey,
                'User-Agent': 'VinNesia-DomainForm/1.0'
            },
            body: JSON.stringify(adminData),
            timeout: 10000 // 10 second timeout
        });

        // Check if admin API request was successful
        if (!adminResponse.ok) {
            const errorText = await adminResponse.text();
            console.error('Admin API error:', {
                status: adminResponse.status,
                statusText: adminResponse.statusText,
                response: errorText
            });

            // Return different messages based on status code
            let errorMessage;
            switch (adminResponse.status) {
                case 401:
                    errorMessage = 'Authentication failed with admin panel';
                    break;
                case 403:
                    errorMessage = 'Access denied by admin panel';
                    break;
                case 429:
                    errorMessage = 'Too many requests. Please try again later';
                    break;
                case 500:
                    errorMessage = 'Admin panel server error';
                    break;
                default:
                    errorMessage = 'Failed to submit to admin panel';
            }

            return res.status(adminResponse.status).json({
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? errorText : undefined
            });
        }

        // Parse admin API response
        let adminResult;
        try {
            const responseText = await adminResponse.text();
            adminResult = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error('Failed to parse admin API response:', parseError);
            adminResult = { message: 'Response received but not parseable' };
        }

        // Log success
        console.log('Successfully submitted to admin panel:', {
            name: adminData.name,
            email: adminData.email,
            adminResponseStatus: adminResponse.status
        });

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Application submitted successfully to admin panel',
            data: {
                submitted_at: adminData.submitted_at,
                admin_response: adminResult
            }
        });

    } catch (error) {
        // Log error details
        console.error('Submission error:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });

        // Handle different types of errors
        let errorMessage = 'Internal server error occurred';
        let statusCode = 500;

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Failed to connect to admin panel';
            statusCode = 502;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Admin panel is currently unavailable';
            statusCode = 503;
        } else if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
            errorMessage = 'Request timeout. Please try again';
            statusCode = 408;
        }

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Helper function to validate URL (can be used in other parts)
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return ['http:', 'https:'].includes(url.protocol);
    } catch (_) {
        return false;
    }
}

// Helper function to sanitize input
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 500); // Limit length
}

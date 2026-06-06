/**
 * Tek serverless fonksiyon: paytr-token, paytr-callback, paytr-installments, payment-requests
 */
import token from '../lib/routes/paytr-token.js';
import callback from '../lib/routes/paytr-callback.js';
import installments from '../lib/routes/paytr-installments.js';
import paymentRequests from '../lib/routes/payment-requests.js';
import { corsHeaders } from '../lib/db.js';

const HANDLERS = {
    token,
    callback,
    installments,
    'payment-requests': paymentRequests,
};

export default async function handler(req, res) {
    const action = req.query?.action;
    const route = HANDLERS[action];

    if (!route) {
        corsHeaders(res);
        return res.status(404).json({
            error: 'Bilinmeyen PayTR işlemi',
            action,
            allowed: Object.keys(HANDLERS),
        });
    }

    return route(req, res);
}

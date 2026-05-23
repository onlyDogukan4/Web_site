/**
 * Tek serverless fonksiyon: products, packages, concepts, campaigns, settings, orders
 * Eski URL'ler vercel.json rewrite ile ?resource=... ekler.
 */
import products from '../lib/routes/products.js';
import packages from '../lib/routes/packages.js';
import concepts from '../lib/routes/concepts.js';
import campaigns from '../lib/routes/campaigns.js';
import settings from '../lib/routes/settings.js';
import orders from '../lib/routes/orders.js';
import { corsHeaders } from '../lib/db.js';

const HANDLERS = {
    products,
    packages,
    concepts,
    campaigns,
    settings,
    orders,
};

export default async function handler(req, res) {
    const resource = req.query?.resource;
    const route = HANDLERS[resource];

    if (!route) {
        corsHeaders(res);
        return res.status(404).json({
            error: 'Bilinmeyen kaynak',
            resource,
            allowed: Object.keys(HANDLERS),
        });
    }

    return route(req, res);
}

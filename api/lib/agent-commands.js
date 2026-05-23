/**
 * Mr. Karton agent komutları — model çıktısından parse
 */

const TAG =
    /\[(ADD_CONCEPT_CART|ADD_CART|SUGGEST_PACKAGE|OPEN_PAGE|AGENT_STATE):?\s*([^\]]*)\]/gi;

export function stripAgentTags(text) {
    return text.replace(TAG, '').replace(/\n{3,}/g, '\n\n').trim();
}

export function parseAgentCommands(text) {
    const actions = [];
    let agentStateUpdate = null;

    let m;
    const re = /\[(ADD_CONCEPT_CART|ADD_CART|SUGGEST_PACKAGE|OPEN_PAGE|AGENT_STATE):?\s*([^\]]*)\]/gi;
    while ((m = re.exec(text)) !== null) {
        const type = m[1].toUpperCase();
        const payload = (m[2] || '').trim();

        switch (type) {
            case 'ADD_CART':
                actions.push({ type: 'add_cart', productQuery: payload });
                break;
            case 'SUGGEST_PACKAGE':
                actions.push({ type: 'suggest_package', packageId: payload || 'wedding' });
                break;
            case 'OPEN_PAGE':
                actions.push({ type: 'open_page', url: payload });
                break;
            case 'ADD_CONCEPT_CART': {
                try {
                    const data = JSON.parse(payload);
                    actions.push({ type: 'add_concept_cart', data });
                } catch {
                    /* JSON parse hatası — yoksay */
                }
                break;
            }
            case 'AGENT_STATE': {
                try {
                    agentStateUpdate = JSON.parse(payload);
                } catch {
                    /* */
                }
                break;
            }
        }
    }

    return { actions, agentStateUpdate, cleanText: stripAgentTags(text) };
}

/** Özel bardak siparişi için zorunlu alanlar */
export const CUSTOM_CUP_FIELDS = [
    'conceptId',
    'size',
    'lid',
    'quantity',
    'note',
];

export function getMissingCustomCupFields(data) {
    const missing = [];
    if (!data?.conceptId) missing.push('conceptId');
    if (!data?.size) missing.push('size');
    if (!data?.lid) missing.push('lid');
    if (!data?.quantity || data.quantity < 1) missing.push('quantity');
    return missing;
}

export function fieldQuestionTr(field, concepts = []) {
    const conceptList = concepts.map((c) => `${c.name} (id: ${c.id})`).join(', ');
    const map = {
        conceptId: `Hangi konsept veya tema size uygun? Mevcut konseptler: ${conceptList || 'düğün, yılbaşı'}.`,
        size: 'Hangi boyutu tercih edersiniz? Seçenekler: 4oz, 7oz, 8oz, 12oz.',
        lid: 'Kapaklı mı kapaksız mı olsun? (kapaklı / kapaksız)',
        quantity: 'Kaç adet sipariş etmek istersiniz?',
        note: 'Bardak üzerinde yazılmasını istediğiniz metin veya özel not var mı? (yoksa "yok" yazabilirsiniz)',
    };
    return map[field] || 'Bu bilgiyi paylaşır mısınız?';
}

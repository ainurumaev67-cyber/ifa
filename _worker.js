const exhaustedFlags = {
    key_1: false,
    key_2: false,
    key_3: false,
    key_4: false
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // API
        if (url.pathname === '/api' && request.method === 'POST') {
            const response = await handleApiRequest(request, env);
            response.headers.set('Access-Control-Allow-Origin', '*');
            return response;
        }

        // Статика
        return env.ASSETS.fetch(request);
    },

    async scheduled(controller, env, ctx) {
        exhaustedFlags.key_1 = false;
        exhaustedFlags.key_2 = false;
        exhaustedFlags.key_3 = false;
        exhaustedFlags.key_4 = false;
    }
};

async function handleApiRequest(request, env) {
    const { message } = await request.json();
    if (!message?.trim()) return jsonResponse({ reply: 'Введите вопрос.' });

    const keyIndex = getActiveKeyIndex();
    if (!keyIndex) return jsonResponse({ reply: 'Ассистент устал. Время работы: 06:00–22:00 МСК.' });

    if (exhaustedFlags[`key_${keyIndex}`]) return jsonResponse({ reply: 'Ассистент устал. Попробуйте позже.' });

    const hfKey = env[`HF_KEY_${keyIndex}`];
    const hfResponse = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `<s>[INST] ${message} [/INST]`,
                parameters: { max_new_tokens: 512 }
            })
        }
    );

    if (hfResponse.status === 429 || hfResponse.status === 403) {
        exhaustedFlags[`key_${keyIndex}`] = true;
        return jsonResponse({ reply: 'Ассистент устал.' });
    }

    if (!hfResponse.ok) return jsonResponse({ reply: 'Ошибка ИИ.' });

    const data = await hfResponse.json();
    return jsonResponse({ reply: data[0]?.generated_text || 'Нет ответа.' });
}

function getActiveKeyIndex() {
    const mskHour = (new Date().getUTCHours() + 3) % 24;
    if (mskHour >= 6 && mskHour < 10) return 1;
    if (mskHour >= 10 && mskHour < 14) return 2;
    if (mskHour >= 14 && mskHour < 18) return 3;
    if (mskHour >= 18 && mskHour < 22) return 4;
    return null;
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}

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
    try {
        const { message } = await request.json();
        if (!message?.trim()) return jsonResponse({ reply: 'Введите вопрос.' });

        const keyIndex = getActiveKeyIndex();
        if (!keyIndex) return jsonResponse({ reply: 'Ассистент устал. Время работы: 06:00–22:00 МСК.' });

        if (exhaustedFlags[`key_${keyIndex}`]) return jsonResponse({ reply: 'Ассистент устал. Попробуйте позже.' });

        const hfKey = env[`HF_KEY_${keyIndex}`];

        // НОВЫЙ URL Hugging Face
        const hfResponse = await fetch(
            'https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${hfKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mistralai/Mistral-7B-Instruct-v0.3',
                    messages: [{ role: 'user', content: message }],
                    max_tokens: 512
                })
            }
        );

        // Выводим статус ответа от HF в логи для отладки
        console.log(`[IFA] HF Response Status: ${hfResponse.status}`);

        if (hfResponse.status === 429 || hfResponse.status === 403) {
            exhaustedFlags[`key_${keyIndex}`] = true;
            console.log(`[IFA] Key ${keyIndex} exhausted.`);
            return jsonResponse({ reply: 'Ассистент устал.' });
        }

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            console.error(`[IFA] HF API Error: ${errorText}`);
            return jsonResponse({ reply: 'Ошибка при обращении к ИИ.' });
        }

        const data = await hfResponse.json();
        
        // Парсим ответ от нового API
        const reply = data.choices?.[0]?.message?.content || 'Нет ответа.';
        return jsonResponse({ reply });

    } catch (error) {
        console.error(`[IFA] Worker Exception: ${error.message}`);
        return jsonResponse({ reply: 'Внутренняя ошибка сервера.' });
    }
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

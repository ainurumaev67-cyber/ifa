// Хранилище флагов в памяти Worker
const exhaustedFlags = {
    key_1: false,
    key_2: false,
    key_3: false,
    key_4: false
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 1. Обработка CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }

        // 2. API-запросы
        if (url.pathname === '/api' && request.method === 'POST') {
            return handleApiRequest(request, env);
        }

        // 3. ВСЁ ОСТАЛЬНОЕ — СТАТИКА
        // Просто получаем файл из assets и отдаём как есть.
        // Cloudflare сам добавит правильные Content-Type заголовки.
        try {
            return env.ASSETS.fetch(request);
        } catch (e) {
            return new Response('File not found', { status: 404 });
        }
    },

    // Обработчик Cron-триггера
    async scheduled(controller, env, ctx) {
        exhaustedFlags.key_1 = false;
        exhaustedFlags.key_2 = false;
        exhaustedFlags.key_3 = false;
        exhaustedFlags.key_4 = false;
        console.log('[IFA] Флаги сброшены.');
    }
};

// ... (все остальные функции handleApiRequest, getActiveKeyIndex и т.д. остаются БЕЗ ИЗМЕНЕНИЙ) ...

async function handleApiRequest(request, env) {
    try {
        const { message } = await request.json();
        if (!message || message.trim() === '') {
            return jsonResponse({ reply: 'Введите вопрос.' });
        }

        const keyIndex = getActiveKeyIndex();
        if (keyIndex === null) {
            return jsonResponse({ reply: 'Ассистент устал. Время работы: 06:00–22:00 МСК.' });
        }

        if (exhaustedFlags[`key_${keyIndex}`]) {
            return jsonResponse({ reply: 'Ассистент устал. Попробуйте позже.' });
        }

        const hfKey = env[`HF_KEY_${keyIndex}`];
        if (!hfKey) {
            return jsonResponse({ reply: 'Ошибка сервера.' }, 500);
        }

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
                    parameters: { max_new_tokens: 512, temperature: 0.7 }
                })
            }
        );

        if (hfResponse.status === 429 || hfResponse.status === 403) {
            exhaustedFlags[`key_${keyIndex}`] = true;
            return jsonResponse({ reply: 'Ассистент устал. Попробуйте позже.' });
        }

        if (!hfResponse.ok) {
            return jsonResponse({ reply: 'Ошибка при обращении к ИИ.' }, 502);
        }

        const data = await hfResponse.json();
        const reply = data[0]?.generated_text || 'Не удалось получить ответ.';
        return jsonResponse({ reply });

    } catch (error) {
        return jsonResponse({ reply: 'Ошибка сервера.' }, 500);
    }
}

function getActiveKeyIndex() {
    const now = new Date();
    const mskHour = (now.getUTCHours() + 3) % 24;
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
// version: 1.0.1

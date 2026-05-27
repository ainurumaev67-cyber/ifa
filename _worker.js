// Хранилище флагов в памяти Worker
const exhaustedFlags = {
    key_1: false,
    key_2: false,
    key_3: false,
    key_4: false
};

export default {
    // Обработчик HTTP-запросов
    async fetch(request, env) {
        const url = new URL(request.url);

        // Обработка OPTIONS (preflight CORS)
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders()
            });
        }

        let response;

        // API: запрос к Hugging Face
        if (url.pathname === '/api' && request.method === 'POST') {
            response = await handleApiRequest(request, env);
        } else {
            // Статика
            response = await env.ASSETS.fetch(request);
        }

        // Добавляем CORS и X-Frame-Options заголовки ко всем ответам
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
        // РАЗРЕШАЕМ встраивание в iframe
        newHeaders.delete('X-Frame-Options');
        newHeaders.set('Content-Security-Policy', "frame-ancestors *");

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    },

    // Обработчик Cron-триггера
    async scheduled(controller, env, ctx) {
        exhaustedFlags.key_1 = false;
        exhaustedFlags.key_2 = false;
        exhaustedFlags.key_3 = false;
        exhaustedFlags.key_4 = false;
        console.log('[IFA] Флаги сброшены. Все ключи активны.');
    }
};

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}

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
        headers: { 'Content-Type': 'application/json' }
    });
}

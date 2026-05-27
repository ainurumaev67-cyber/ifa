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

        // API: запрос к Hugging Face
        if (url.pathname === '/api' && request.method === 'POST') {
            return handleApiRequest(request, env);
        }

        // Всё остальное — статика
        return env.ASSETS.fetch(request);
    },

    // Обработчик Cron-триггера (сброс флагов в 00:00 МСК)
    async scheduled(controller, env, ctx) {
        exhaustedFlags.key_1 = false;
        exhaustedFlags.key_2 = false;
        exhaustedFlags.key_3 = false;
        exhaustedFlags.key_4 = false;
        console.log('[IFA] Флаги сброшены. Все ключи активны.');
    }
};

async function handleApiRequest(request, env) {
    try {
        const { message } = await request.json();
        if (!message || message.trim() === '') {
            return jsonResponse({ reply: 'Введите вопрос.' });
        }

        // Определяем активный ключ по московскому времени
        const keyIndex = getActiveKeyIndex();
        if (keyIndex === null) {
            return jsonResponse({ reply: 'Ассистент устал. Время работы: 06:00–22:00 МСК.' });
        }

        // Проверяем флаг "устал" в памяти
        if (exhaustedFlags[`key_${keyIndex}`]) {
            return jsonResponse({ reply: 'Ассистент устал. Попробуйте позже.' });
        }

        // Получаем ключ из секретных переменных
        const hfKey = env[`HF_KEY_${keyIndex}`];
        if (!hfKey) {
            console.error(`[IFA] Ключ HF_KEY_${keyIndex} не найден`);
            return jsonResponse({ reply: 'Ошибка сервера.' }, 500);
        }

        console.log(`[IFA] Использую ключ HF_KEY_${keyIndex}`);

        // Запрос к Hugging Face
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
                    parameters: {
                        max_new_tokens: 512,
                        temperature: 0.7
                    }
                })
            }
        );

        // Если лимит исчерпан — ставим флаг
        if (hfResponse.status === 429 || hfResponse.status === 403) {
            exhaustedFlags[`key_${keyIndex}`] = true;
            console.warn(`[IFA] Ключ HF_KEY_${keyIndex} исчерпан. Установлен флаг.`);
            return jsonResponse({ reply: 'Ассистент устал. Попробуйте позже.' });
        }

        if (!hfResponse.ok) {
            console.error(`[IFA] Ошибка Hugging Face: ${hfResponse.status}`);
            return jsonResponse({ reply: 'Ошибка при обращении к ИИ.' }, 502);
        }

        const data = await hfResponse.json();
        const reply = data[0]?.generated_text || 'Не удалось получить ответ.';

        return jsonResponse({ reply });

    } catch (error) {
        console.error(`[IFA] Ошибка сервера: ${error.message}`);
        return jsonResponse({ reply: 'Произошла ошибка на сервере.' }, 500);
    }
}

function getActiveKeyIndex() {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const mskHour = (utcHour + 3) % 24;

    if (mskHour >= 6 && mskHour < 10) return 1;
    if (mskHour >= 10 && mskHour < 14) return 2;
    if (mskHour >= 14 && mskHour < 18) return 3;
    if (mskHour >= 18 && mskHour < 22) return 4;

    return null;
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- Cron-запрос: сброс флагов через Cloudflare API ---
    if (request.headers.get('X-Cron-Trigger') === 'reset-exhausted') {
      await resetAllFlags(env);
      return new Response('OK', { status: 200 });
    }

    // --- API: запрос к Hugging Face ---
    if (url.pathname === '/api' && request.method === 'POST') {
      return handleApiRequest(request, env);
    }

    // --- Статика ---
    return env.ASSETS.fetch(request);
  }
};

async function handleApiRequest(request, env) {
  try {
    const { message } = await request.json();
    if (!message) {
      return jsonResponse({ reply: 'Введите вопрос.' });
    }

    const keyIndex = getActiveKeyIndex();
    if (keyIndex === null) {
      return jsonResponse({ reply: 'Ассистент устал. Время работы: 06:00–22:00 МСК.' });
    }

    const exhausted = env[`KEY_${keyIndex}_EXHAUSTED`];
    if (exhausted === 'true') {
      return jsonResponse({ reply: 'Ассистент устал. Попробуйте позже.' });
    }

    const hfKey = env[`HF_KEY_${keyIndex}`];
    if (!hfKey) {
      return jsonResponse({ reply: 'Ошибка сервера.' }, 500);
    }

    const response = await fetch(
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

    if (response.status === 429 || response.status === 403) {
      await setExhaustedFlag(env, keyIndex);
      return jsonResponse({ reply: 'Ассистент устал. Попробуйте позже.' });
    }

    const data = await response.json();
    const reply = data[0]?.generated_text || 'Не удалось получить ответ.';
    return jsonResponse({ reply });

  } catch (e) {
    return jsonResponse({ reply: 'Ошибка сервера.' }, 500);
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

async function setExhaustedFlag(env, keyIndex) {
  const varName = `KEY_${keyIndex}_EXHAUSTED`;
  await updateWorkerVar(env, varName, 'true');
}

async function resetAllFlags(env) {
  for (let i = 1; i <= 4; i++) {
    await updateWorkerVar(env, `KEY_${i}_EXHAUSTED`, 'false');
  }
}

async function updateWorkerVar(env, varName, value) {
  const accountId = env.CF_ACCOUNT_ID;
  const scriptName = env.CF_SCRIPT_NAME || 'ifa-project';
  const apiToken = env.CF_API_TOKEN;

  if (!accountId || !apiToken) return;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}/environments/production`;

  const getResp = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  const getData = await getResp.json();
  const currentVars = getData.result?.env_vars || {};

  currentVars[varName] = { type: 'secret_text', value: value };

  await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ env_vars: currentVars })
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
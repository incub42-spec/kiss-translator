# Примеры пользовательских интерфейсов (документ устарел, к новой версии неприменим)

Примеры для версии V2 смотрите здесь: [custom-api_v2.ru.md](custom-api_v2.ru.md)

Примеры ниже присланы пользователями и приводятся для ознакомления.

## Локальный запуск квантованной модели Seed-X-PPO-7B

> Прислал пользователь emptyghost6, источник: https://linux.do/t/topic/828257

URL

```sh
http://localhost:8000/v1/completions
```

Request Hook

```js
(text, from, to, url, key) => {
  // Соответствие кодов языков, поддерживаемых моделью, их полным названиям
  const langFullNameMap = {
    ar: 'Arabic', fr: 'French', ms: 'Malay', ru: 'Russian',
    cs: 'Czech', hr: 'Croatian', nb: 'Norwegian Bokmal', sv: 'Swedish',
    da: 'Danish', hu: 'Hungarian', nl: 'Dutch', th: 'Thai',
    de: 'German', id: 'Indonesian', no: 'Norwegian', tr: 'Turkish',
    en: 'English', it: 'Italian', pl: 'Polish', uk: 'Ukrainian',
    es: 'Spanish', ja: 'Japanese', pt: 'Portuguese', vi: 'Vietnamese',
    fi: 'Finnish', ko: 'Korean', ro: 'Romanian', zh: 'Chinese'
  };

  // Преобразование кода языка из системы хуков в код, понятный API модели
  const getModelLangCode = (lang) => {
    if (lang === 'zh-CN' || lang === 'zh-TW') return 'zh';
    return lang;
  };

  const sourceLangCode = getModelLangCode(from);
  const targetLangCode = getModelLangCode(to);

  const sourceLangName = langFullNameMap[sourceLangCode] || from;
  const targetLangName = langFullNameMap[targetLangCode] || to;

  const prompt = `Translate it to ${targetLangName}:\n${text} <${targetLangCode}>`;

  // Формирование тела запроса
  const bodyObject = {
    model: "./ByteDance-Seed/Seed-X-PPO-7B-AWQ-Int4",
    prompt: prompt,
    max_tokens: 2048,
    temperature: 0.0,
  };

  // Итоговая конфигурация запроса
  return [url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Важно: объект JavaScript нужно превратить в строку JSON
    body: JSON.stringify(bodyObject),
  }];
}
```

Response Hook

```js
(res, text, from, to) => {
  // Проверяем, что ответ корректен
  if (res && res.choices && res.choices.length > 0 && res.choices[0].text) {

    // Извлекаем перевод и убираем возможные пробелы по краям
    const translatedText = res.choices[0].text.trim();

    // Сравниваем оригинал и перевод: совпадают — true, иначе false
    const areTextsIdentical = text.trim() === translatedText;

    // Возвращаем массив: [перевод, совпадает ли он с оригиналом]
    return [translatedText, areTextsIdentical];
  }
  // Если формат ответа неверен или перевода нет — бросаем ошибку
  throw new Error("Invalid API response format or no translation found.");
}
```

## Подключение openrouter

> Прислал пользователь Rick Sanchez

URL

```sh
https://openrouter.ai/api/v1/chat/completions
```

Request Hook

```js
(text, from, to, url, key) => [url, {
  method: "POST",
  headers: {
      "Authorization": `Bearer ${key}`,
      "Content-type": "application/json",
  },
  body: JSON.stringify({
    "model": "deepseek/deepseek-chat-v3-0324:free", // здесь можно указать свою модель
    "messages": [
      {
        "role": "user",
        "content":  // здесь можно указать свой промпт
`You are a professional ${to} native translator. Your task is to produce a fluent, natural, and culturally appropriate translation of the following text from ${from} to ${to}, fully conveying the meaning, tone, and nuance of the original.

## Translation Rules
1. Output only the final polished translation — no explanations, intermediate drafts, or notes.
2. Translate in a way that reads naturally to a native ${to} audience, adapting idioms, cultural references, and tone when necessary.
3. Preserve proper nouns, technical terms, brand names, and URLs exactly as in the original text unless a widely accepted ${to} equivalent exists.
4. Keep any formatting (Markdown, HTML tags, bullet points, numbering) intact and positioned naturally within the translation.
5. Adapt humor, metaphors, and figurative language to culturally relevant forms in ${to} while keeping the original intent.
6. Maintain the same level of formality or informality as the original.

Source Text: ${text}

Translated Text:`
      }
    ]
  })
}]
```

Response Hook

```js
(res, text, from, to) => [
  res.choices?.[0]?.message?.content ?? "", 
  false
]
```

## Подключение gemini-2.5-flash с отключённым режимом рассуждений и снятыми фильтрами

> Прислал пользователь Rick Sanchez

URL

```sh
https://generativelanguage.googleapis.com/v1beta/models
```

Request Hook

```js
(text, from, to, url, key) => [`${url}/gemini-2.5-flash:generateContent?key=${key}`, {
    headers: {
        "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
        "generationConfig": {
            "temperature": 0.8,
            "thinkingConfig": {
                "thinkingBudget": 0, // для gemini-2.5-flash значение 0 отключает режим рассуждений
            },
        },
        "safetySettings": [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE",
            }
        ],
        "contents": [{
            "parts": [{
                "text": `свой промпт`
            }]
        }],
    }),
}]
```

Response Hook

```js
(res, text, from, to) => [
  res.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
  false
]
```

## Подключение Qwen-MT

> Прислал пользователь atom

URL

```sh
https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

Request Hook

```js
(text, from, to, url, key) => {
  const mapLanguageCode = (lang) => ({
    'zh-CN': 'zh',
    'zh-TW': 'zh_tw',
  })[lang] || lang;

  const targetLang = mapLanguageCode(to);

  return [
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        "model": "qwen-mt-turbo",
        "messages": [
          {
            "role": "user",
            "content": text
          }
        ],
        "translation_options": {
          "source_lang": "auto",
          "target_lang": targetLang
        }
      })
    }
  ];
}
```

Response Hook

```js
(res, text, from, to) => [res.choices?.[0]?.message?.content ?? "", false]
```


## Подключение интерфейса deepl

> Источник: https://github.com/fishjar/kiss-translator/issues/101#issuecomment-2123786236

Request Hook

```js
(text, from, to, url, key) => [
  url,
  {
    headers: {
      "Content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      text,
      target_lang: "ZH",
      source_lang: "auto",
    }),
  },
]
```

Response Hook

```js
(res, text, from, to) => [res.data, "ZH" === res.source_lang]
```

## Подключение больших моделей Zhipu AI

> Источник: https://github.com/fishjar/kiss-translator/issues/205#issuecomment-2642422679

Request Hook

```js
(text, from, to, url, key) => [url, {
  "method": "POST",
  "headers": {
    "Content-type": "application/json",
    "Authorization": key
  },
  "body": JSON.stringify({
  	"model": "glm-4-flash",
  	"messages": [
  		{
  			"role":"system",
  			"content": "You are a professional, authentic machine translation engine. You only return the translated text, without any explanations."
  		},
  		{
  			"role": "user",
  			"content": `Translate the following text into ${to}. If translation is unnecessary (e.g. proper nouns, codes, etc.), return the original text. NO explanations. NO notes:\n\n ${text} `
  		}
  	]
  })
}]
```

## Подключение нового интерфейса Google

> Прислал пользователь Bush2021, источник: https://github.com/fishjar/kiss-translator/issues/225#issuecomment-2810950717

URL

```sh
https://translate-pa.googleapis.com/v1/translateHtml
```

KEY

```sh
AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520
```

Request Hook

```js
(text, from, to, url, key) => [url, {
    method: "POST", 
    headers: { 
        "Content-Type": "application/json+protobuf", 
        "X-Goog-API-Key": key
    }, 
    body: JSON.stringify([[[text], from || "auto", to], "wt_lib"])
}]
```

Response Hook

```js
(res, text, from, to) => [res?.[0]?.join(" ") || "Translation unavailable", to === res?.[1]?.[0]]
```

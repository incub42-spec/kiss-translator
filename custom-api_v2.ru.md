# Пользовательский интерфейс: описание и примеры

## Формат по умолчанию

Если запросы и ответы вашего сервиса соответствуют описанному ниже формату,
заполнять `Request Hook` и `Response Hook` не нужно.


### Без пакетного перевода

Request body

```json
{
  "text": "hello",    // текст для перевода
  "from":"auto",      // язык оригинала
  "to": "zh-CN"       // язык перевода
}
```

Response

```json
{
  "text": "你好",    // перевод
  "src": "en"       // язык оригинала
}

// либо
{
  "text": "你好",    // перевод
  "from": "en"       // язык оригинала
}
```


### С пакетным переводом

Request body

```json
{
  "texts": ["hello"], // список текстов для перевода
  "from":"auto",      // язык оригинала
  "to": "zh-CN"       // язык перевода
}
```

Response

```json
[
  {
    "text": "你好",    // перевод
    "src": "en"       // язык оригинала
  }
]
```

Начиная с версии 2.0.4 поддерживается и такой формат ответа:

```json
{
  "translations": [   // список переводов
    {
      "text": "你好",  // перевод
      "src": "en"     // язык оригинала
    }
  ]
}
```

## Про Prompt

Подстановки, доступные в `Prompt`:

```js
`{{from}}`        // название языка оригинала
`{{to}}`          // название языка перевода
`{{fromLang}}`    // код языка оригинала
`{{toLang}}`      // код языка перевода
`{{text}}`        // исходный текст
`{{tone}}`        // стиль изложения
`{{title}}`       // заголовок страницы
`{{description}}` // описание страницы
```

Типы `Prompt`, доступные в хуках:

```js
`systemPrompt`      // System Prompt для пакетного перевода
`nobatchPrompt`     // System Prompt для перевода без пакетов
`nobatchUserPrompt` // User Prompt для перевода без пакетов
`subtitlePrompt`    // System Prompt для перевода субтитров
```

## Google Translate

> Пакетный перевод этим интерфейсом не поддерживается

URL

```
https://translate.googleapis.com/translate_a/single?client=gtx&dj=1&dt=t&ie=UTF-8&q={{text}}&sl=en&tl=zh-CN
```

Request Hook

```js
async (args) => {
  const url = args.url.replace("{{text}}", args.texts[0]);
  const method = "GET";
  return { url, method };
};
```

Response Hook

```js
async ({ res }) => {
  return { translations: [[res?.sentences?.[0]?.trans || "", res?.src]] };
};
```


## Ollama

> Пример для включённого пакетного перевода

* Обратите внимание: при запуске ollama нужна переменная окружения `OLLAMA_ORIGINS=*`
* Проверить, что переменная применилась: `systemctl show ollama | grep OLLAMA_ORIGINS`

URL

```
http://localhost:11434/v1/chat/completions
```

Request Hook

```js
async (args) => {
  const url = args.url;
  const method = "POST";
  const headers = { "Content-type": "application/json" };
  const body = {
    model: "gemma3", // либо args.model
    messages: [
      {
        role: "system",
        content: args.systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify({
          targetLanguage: args.toLang,
          segments: args.texts.map((text, id) => ({ id, text })),
          title: "", // можно не указывать
          description: "", // можно не указывать
          glossary: {}, // можно не указывать
          tone: "", // можно не указывать
        }),
      },
    ],
    temperature: 0,
    max_tokens: 20480,
    think: false,
    stream: false,
  };

  return { url, body, headers, method };
};
```

Response Hook

```js
async ({ res, parseAIRes }) => {
  const translations = parseAIRes(res?.choices?.[0]?.message?.content);
  return { translations };
};
```


## SiliconFlow

> Пример для отключённого пакетного перевода

URL

```
https://api.siliconflow.cn/v1/chat/completions
```

Request Hook

```js
async (args) => {
  const url = args.url;
  const method = "POST";
  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${args.key}`,
  };
  const body = {
    model: "tencent/Hunyuan-MT-7B", // либо args.model,
    messages: [
      {
        role: "system",
        content: args.systemPrompt,
      },
      {
        role: "user",
        content: args.userPrompt,
      },
    ],
    temperature: 0,
    max_tokens: 20480,
  };

  return { url, body, headers, method };
};
```

Response Hook

```js
async ({ res }) => {
  return { translations: [[res?.choices?.[0]?.message?.content || ""]] };
};
```


## Коды языков и пояснения

Что означают языковые поля в аргументах хука:

- `toLang`, `fromLang` — стандартные коды языков, поддерживаемые расширением
- `to`, `from` — коды, уже преобразованные под конкретный интерфейс

Если ваш сервис использует другие коды, преобразуйте их самостоятельно.

```
["en", "English - English"],
["zh-CN", "Simplified Chinese - 简体中文"],
["zh-TW", "Traditional Chinese - 繁體中文"],
["ar", "Arabic - العربية"],
["bg", "Bulgarian - Български"],
["ca", "Catalan - Català"],
["hr", "Croatian - Hrvatski"],
["cs", "Czech - Čeština"],
["da", "Danish - Dansk"],
["nl", "Dutch - Nederlands"],
["fa", "Persian - فارسی"],
["fi", "Finnish - Suomi"],
["fr", "French - Français"],
["de", "German - Deutsch"],
["el", "Greek - Ελληνικά"],
["hi", "Hindi - हिन्दी"],
["hu", "Hungarian - Magyar"],
["id", "Indonesian - Indonesia"],
["it", "Italian - Italiano"],
["ja", "Japanese - 日本語"],
["ko", "Korean - 한국어"],
["ms", "Malay - Melayu"],
["mt", "Maltese - Malti"],
["nb", "Norwegian - Norsk Bokmål"],
["pl", "Polish - Polski"],
["pt", "Portuguese - Português"],
["ro", "Romanian - Română"],
["ru", "Russian - Русский"],
["sk", "Slovak - Slovenčina"],
["sl", "Slovenian - Slovenščina"],
["es", "Spanish - Español"],
["sv", "Swedish - Svenska"],
["ta", "Tamil - தமிழ்"],
["te", "Telugu - తెలుగు"],
["th", "Thai - ไทย"],
["tr", "Turkish - Türkçe"],
["uk", "Ukrainian - Українська"],
["vi", "Vietnamese - Tiếng Việt"],
```

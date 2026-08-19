// const NVIDIA_URL =
//   'https://integrate.api.nvidia.com/v1/chat/completions';

// const MODEL =
//   process.env.NVIDIA_MODEL ||
//   'nvidia/nemotron-3-super-120b-a12b';

// async function askNvidia(messages) {
//   const response = await fetch(NVIDIA_URL, {
//     method: 'POST',

//     headers: {
//       Authorization:
//         `Bearer ${process.env.NVIDIA_API_KEY}`,

//       'Content-Type': 'application/json',
//       Accept: 'application/json',
//     },

//     body: JSON.stringify({
//       model: MODEL,

//       messages,

//       temperature: 1,

//       top_p: 0.95,

//       max_tokens: 4096,

//       stream: false,

//       extra_body: {
//         chat_template_kwargs: {
//           enable_thinking: false,
//         },
//       },
//     }),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();

//     console.error(
//       'NVIDIA API error:',
//       response.status,
//       errorText,
//     );

//     throw new Error(
//       `NVIDIA API error: ${response.status}`,
//     );
//   }

//   const data = await response.json();

//   return (
//     data?.choices?.[0]?.message?.content ||
//     'I could not generate a response.'
//   );
// }

// module.exports = {
//   askNvidia,
// };

// src/services/nvidiaService.ts
import { NVIDIA_CONFIG, SYSTEM_PROMPTS } from '../config/nvidia';
import { ChatMessagePayload, ChatMode }  from '../types/chat.types';

interface NvidiaApiResponse {
  choices: Array<{
    message: { role: string; content: string };
  }>;
  usage?: {
    prompt_tokens:     number;
    completion_tokens: number;
    total_tokens:      number;
  };
}

/* ─────────────────────────────────────────────────────────
   buildMessages
───────────────────────────────────────────────────────── */
function buildMessages(
  mode:         ChatMode,
  history:      ChatMessagePayload[],
  userMessage:  string,
  userProfile?: {
    name?:       string;
    skills?:     string[];
    experience?: string;
    location?:   string;
  },
): ChatMessagePayload[] {
  let systemPrompt = SYSTEM_PROMPTS[mode];

  if (userProfile) {
    const lines: string[] = [];
    if (userProfile.name)            lines.push(`User name: ${userProfile.name}`);
    if (userProfile.skills?.length)  lines.push(`Skills: ${userProfile.skills.join(', ')}`);
    if (userProfile.experience)      lines.push(`Experience: ${userProfile.experience}`);
    if (userProfile.location)        lines.push(`Location: ${userProfile.location}`);
    if (lines.length) {
      systemPrompt += `\n\nUser profile context:\n${lines.join('\n')}`;
    }
  }

  return [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10),                   // last 10 turns for context
    { role: 'user',   content: userMessage },
  ];
}

/* ─────────────────────────────────────────────────────────
   callChatCompletion
   Low-level call to the (single, existing) NVIDIA model.
   Both AI mode and Google mode route through this — same model,
   same config, only the messages array differs.
───────────────────────────────────────────────────────── */
async function callChatCompletion(messages: ChatMessagePayload[]): Promise<{
  reply: string;
  usage?: {
    promptTokens:     number;
    completionTokens: number;
    totalTokens:      number;
  };
}> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), NVIDIA_CONFIG.timeout);

  try {
    const response = await fetch(
      `${NVIDIA_CONFIG.baseUrl}/chat/completions`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model:       NVIDIA_CONFIG.model,
          messages,
          max_tokens:  NVIDIA_CONFIG.maxTokens,
          temperature: NVIDIA_CONFIG.temperature,
          top_p:       NVIDIA_CONFIG.topP,
          stream:      false,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const body   = await response.text().catch(() => '');
      const err: any = new Error(
        `NVIDIA API responded with ${response.status}: ${response.statusText}`,
      );
      err.status = response.status;
      err.body   = body;
      throw err;
    }

    const data = (await response.json()) as NvidiaApiResponse;

    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not generate a response. Please try again.';

    return {
      reply,
      usage: data.usage
        ? {
            promptTokens:     data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens:      data.usage.total_tokens,
          }
        : undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────────────────
   callNvidiaModel  (AI mode — unchanged behavior)
───────────────────────────────────────────────────────── */
export async function callNvidiaModel(
  mode:         ChatMode,
  message:      string,
  history:      ChatMessagePayload[] = [],
  userProfile?: {
    name?:       string;
    skills?:     string[];
    experience?: string;
    location?:   string;
  },
): Promise<{
  reply: string;
  usage?: {
    promptTokens:     number;
    completionTokens: number;
    totalTokens:      number;
  };
}> {
  const messages = buildMessages(mode, history, message, userProfile);
  return callChatCompletion(messages);
}

/* ─────────────────────────────────────────────────────────
   callNvidiaForSearch  (Google mode)
   No history, no userProfile, no SYSTEM_PROMPTS[mode] lookup by
   design — a fresh, isolated call so nothing from a prior AI-mode
   turn (e.g. "I only support your job search...") can leak in and
   bias the answer. Same model, same low-level call as AI mode.
───────────────────────────────────────────────────────── */
export async function callNvidiaForSearch(
  systemPrompt: string,
  userContent:  string,
): Promise<{ reply: string }> {
  const { reply } = await callChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userContent },
  ]);
  return { reply };
}
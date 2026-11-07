/** Server-only transport: accepts text messages, never candidates or account context. */
export async function requestTextPlan(
  messages: { role: string; content: string }[],
  key: string,
  fetcher: typeof fetch = fetch,
  maxTokens?: number,
): Promise<string> {
  const response = await fetcher('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3.8-flash',
      messages,
      ...(maxTokens === undefined ? {} : { max_tokens: maxTokens }),
    }),
  });
  if (!response.ok) {
    // Do not log provider bodies: they can echo inputs.
    let message = 'AI service unavailable';
    try {
      const body = await response.json();
      const safe = body.message ?? body.error?.message;
      if (typeof safe === 'string') message = safe;
    } catch { /* No safe upstream message available. */ }
    throw Object.assign(new Error(message), { status: response.status });
  }
  const body = await response.json();
  return body.choices?.[0]?.message?.content ?? '';
}
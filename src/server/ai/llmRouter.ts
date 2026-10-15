// src/server/ai/llmRouter.ts

export type TaskTier = 'fast_ui' | 'flagship_chat' | 'structured_json' | 'batch_enrichment';

export interface LLMRequest {
  tier: TaskTier;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  timeoutMs: number;
}

export class AtlasLLMRouter {
  private getRouteChain(tier: TaskTier): ProviderConfig[] {
    const groqFast: ProviderConfig = {
      name: 'groq-fast',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      timeoutMs: 4500,
    };

    const openRouterFree: ProviderConfig = {
      name: 'openrouter-primary',
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      timeoutMs: 12000,
    };

    const openRouterFallback: ProviderConfig = {
      name: 'openrouter-qwen-free',
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: 'qwen/qwen-2.5-72b-instruct:free',
      timeoutMs: 12000,
    };

    const geminiDirect: ProviderConfig = {
      name: 'gemini-openai-compat',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      timeoutMs: 10000,
    };

    switch (tier) {
      case 'fast_ui':
      case 'structured_json':
        // Prioritize Groq for sub-300ms UI updates, fallback to OpenRouter then Gemini
        return [groqFast, openRouterFree, geminiDirect];
      case 'flagship_chat':
        // OpenRouter primary with multi-model fallback + Groq speed backup + Gemini fallback
        return [openRouterFree, groqFast, openRouterFallback, geminiDirect];
      case 'batch_enrichment':
        return [geminiDirect, openRouterFree, groqFast];
      default:
        return [openRouterFree, groqFast, geminiDirect];
    }
  }

  async complete(req: LLMRequest): Promise<{ content: string; providerUsed: string }> {
    const chain = this.getRouteChain(req.tier).filter((p) => Boolean(p.apiKey));
    
    // If no explicit API keys are configured, fallback to Gemini if present
    if (chain.length === 0 && process.env.GEMINI_API_KEY) {
      chain.push({
        name: 'gemini-direct',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-flash',
        timeoutMs: 12000,
      });
    }

    if (chain.length === 0) {
      throw new Error('No AI provider keys configured. Please set OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY in .env.local.');
    }

    let lastError: Error | null = null;

    for (const provider of chain) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), provider.timeoutMs);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        };

        if (provider.name.startsWith('openrouter')) {
          headers['HTTP-Referer'] = 'https://blackcinemaatlas.com';
          headers['X-Title'] = 'Black Cinema Atlas';
        }

        const body: Record<string, unknown> = {
          model: provider.model,
          messages: [{ role: 'system', content: req.systemPrompt }, ...req.messages],
          temperature: req.temperature ?? 0.65,
        };

        if (req.jsonSchema) {
          body.response_format = { type: 'json_object' };
        }

        const res = await fetch(provider.baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
          throw new Error(`${provider.name} HTTP ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error(`${provider.name} returned empty content`);

        return { content, providerUsed: provider.name };
      } catch (err) {
        clearTimeout(timer);
        lastError = err as Error;
        console.warn(`[AtlasLLMRouter] ${provider.name} failed, failing over...`, lastError.message);
      }
    }

    throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
  }
}

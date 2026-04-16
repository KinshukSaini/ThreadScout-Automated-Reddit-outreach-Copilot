import {GoogleGenAI} from '@google/genai';
import {NextRequest, NextResponse} from 'next/server';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const ai = GEMINI_API_KEY ? new GoogleGenAI({apiKey: GEMINI_API_KEY}) : null;

type LLMOutput = {
  description: string;
  searchTerms: string[];
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

async function generateWithGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const raw = (await response.json()) as GroqChatResponse;

  if (!response.ok) {
    const details = raw.error?.message || `status ${response.status}`;
    throw new Error(`Groq request failed: ${details}`);
  }

  const content = raw.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Groq returned an empty response");
  }

  return content;
}

async function generateTextWithFallback(prompt: string): Promise<string> {
  let geminiError = "Gemini unavailable";

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text ?? "";
    } catch (error) {
      geminiError = error instanceof Error ? error.message : "Gemini request failed";
      console.warn("Gemini failed, falling back to Groq:", geminiError);
    }
  }

  if (!GROQ_API_KEY) {
    throw new Error(`Gemini failed and GROQ_API_KEY is missing. Gemini error: ${geminiError}`);
  }

  return generateWithGroq(prompt);
}

function toSearchTerms(text: string): string[] {
  const directParse = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  })();

  if (Array.isArray(directParse)) {
    return directParse
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) {
    try {
      const parsed = JSON.parse(bracketMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 5);
      }
    } catch {
      // Keep fallback parsing below.
    }
  }

  return text
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^[-*\d.\s"']+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function toLLMOutput(text: string): LLMOutput {
  const parseCandidate = (candidate: string): LLMOutput | null => {
    try {
      const parsed = JSON.parse(candidate) as {
        description?: unknown;
        search_terms?: unknown;
        searchTerms?: unknown;
      };

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }

      const rawTerms = Array.isArray(parsed.search_terms)
        ? parsed.search_terms
        : Array.isArray(parsed.searchTerms)
          ? parsed.searchTerms
          : [];

      const searchTerms = rawTerms
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 5);

      const description = typeof parsed.description === "string"
        ? parsed.description.trim()
        : "";

      return { description, searchTerms };
    } catch {
      return null;
    }
  };

  const direct = parseCandidate(text);
  if (direct) {
    return direct;
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const fromObject = parseCandidate(objectMatch[0]);
    if (fromObject) {
      return fromObject;
    }
  }

  return {
    description: "",
    searchTerms: toSearchTerms(text),
  };
}

export async function POST(request: NextRequest) {
  let body: { pagesData?: unknown };
  try {
    body = (await request.json()) as { pagesData?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pagesData } = body;

  if (!Array.isArray(pagesData)) {
    return NextResponse.json({ error: "pagesData must be an array" }, { status: 400 });
  }

  if (!GEMINI_API_KEY && !GROQ_API_KEY) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY and GROQ_API_KEY" }, { status: 500 });
  }

  const prompt =`
  [ROLE] 
  You are an expert Growth Strategist. Analyze the provided website data to understand its core value proposition and identify where its potential users hang out on Reddit.

  [TASK]
  1. UNDERSTAND: Determine exactly what problem this website solves and for whom.
  2. DESCRIBE: Write a 1-sentence "Elevator Pitch" that focuses on the "Pain Point" solved.
  3. SEARCH: Generate 5 high-intent search keyterms, these should be chosen to maximize the chances of finding relevant Reddit threads where potential users discuss the problem this website solves. Avoid generic terms.

  [OUTPUT FORMAT]
  You MUST return ONLY a valid JSON object with this exact structure:
  {
    "description": "A concise 1-sentence explanation of what the tool does and the specific problem it solves.",
    "search_terms": ["phrase 1", "phrase 2", "phrase 3", "phrase 4", "phrase 5"]
  }

  [PAGES_DATA]
  ${JSON.stringify(pagesData)}
`

  try {
    const text = await generateTextWithFallback(prompt);
    const llmOutput = toLLMOutput(text);
    console.log(llmOutput);
    return NextResponse.json(llmOutput);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate content";
    console.error("LLM generation failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

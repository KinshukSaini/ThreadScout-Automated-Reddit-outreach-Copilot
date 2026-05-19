import {GoogleGenAI} from '@google/genai';
import {NextRequest, NextResponse} from 'next/server';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const ai = GEMINI_API_KEY ? new GoogleGenAI({apiKey: GEMINI_API_KEY}) : null;

type posts = {
    post_id: string;
    subreddit: string;
    reasoning: string;
    reply_content: string;
}

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
      temperature: 0.4,
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

function parseLLMResponse(aiResponseString : string) : posts[] {
  try {
    const normalized = aiResponseString
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const firstArrayIndex = normalized.indexOf("[");
    const firstObjectIndex = normalized.indexOf("{");
    const startIndex = [firstArrayIndex, firstObjectIndex]
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];

    if (typeof startIndex !== "number") {
      throw new Error("No JSON found in AI response");
    }

    for (let endIndex = normalized.length; endIndex > startIndex; endIndex--) {
      const candidate = normalized.slice(startIndex, endIndex).trim();

      if (!candidate.endsWith("]") && !candidate.endsWith("}")) {
        continue;
      }

      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) {
          return parsed as posts[];
        }
        if (parsed && typeof parsed === 'object') {
          return [parsed as posts];
        }
      } catch {
        // Keep scanning for a smaller slice that contains just the JSON payload.
      }
    }

    throw new Error("No valid JSON found in AI response");
  } catch (error) {
    console.error("Failed to parse AI JSON:", error, "Response (truncated):", aiResponseString.substring(0, 500));
    return []; // Return empty array as fallback
  }
}

export async function POST(request: NextRequest) {
    let req: { websiteData?: unknown; reddit_json?: unknown };
    try {
      req = (await request.json()) as { websiteData?: unknown; reddit_json?: unknown };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const websiteData = req.websiteData;
    const reddit_json = req.reddit_json;

    console.log("Received Reddit JSON");


    if (!Array.isArray(reddit_json)) {
    return NextResponse.json({ error: "reddit_json must be an array" }, { status: 400 });
    }

    if (!websiteData || typeof websiteData !== "object") {
    return NextResponse.json({ error: "websiteData must be an object" }, { status: 400 });
    }

    const description = typeof (websiteData as { description?: unknown }).description === "string"
      ? (websiteData as { description: string }).description
      : "";
    const websiteUrl = typeof (websiteData as { url?: unknown }).url === "string"
      ? (websiteData as { url: string }).url
      : "";

    if (reddit_json.length === 0) {
      return NextResponse.json([]);
    }

    if (!GEMINI_API_KEY && !GROQ_API_KEY) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY and GROQ_API_KEY" }, { status: 500 });
    }

    const prompt = `
        [ROLE]
        You are a Community Success Agent for a startup. Your goal is to find genuine "Problem-Solution Fit" between a website and specific Reddit discussions.

        [CONTEXT]
        Website Description: ${description}
        Website Link: ${websiteUrl}

        [TASK]
        1. PERSONA: Act as a helpful peer "stumbled upon" the thread. 
        2. WRITE: Draft a contextual REPLY for the posts.

        [GUIDELINES for THE REPLY]
        - Start by acknowledging the user's specific problem mentioned in their post.
        - Provide a small piece of general advice or a "pro-tip" FIRST to show value.
        - Introduce the website as a potential solution: "I actually worked on/found this tool called [Name] that does [X]...".
        - Keep the tone humble, helpful, and conversational. Avoid "Marketing-speak" (e.g., no "Unlock your potential" or "Revolutionary").
        - keep it concise - no more than 150 words.

        [DATA]
        Reddit Posts: ${JSON.stringify(reddit_json)}

        [OUTPUT]
        Return ONLY a JSON array of objects with the following structure.
        Include one object per selected posts.
        If no post is relevant, return an empty JSON array []:
        [
            {
                "post_id": "The ID of the specific Reddit post/comment you are replying to",
                "subreddit": "r/example",
                "reasoning": "Why this specific thread is a perfect match. (keep it short, 1-2 sentences)",
                "reply_content": "The actual text of the reply, including the website link naturally."
            },
        ]
    `;
    try {
      const text = await generateTextWithFallback(prompt);
      console.log("Raw LLM Response:", text);
      const parsedPosts = parseLLMResponse(text);
      console.log("Parsed LLM Response:", parsedPosts);
      return NextResponse.json(parsedPosts);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate post content";
      console.error("GenLLM generation failed:", message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
}

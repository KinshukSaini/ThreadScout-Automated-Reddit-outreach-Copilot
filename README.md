# ThreadScout

ThreadScout is an AI-assisted Reddit outreach copilot that turns a website URL into contextual, human-reviewable Reddit reply drafts.

It helps you:

1. Crawl and summarize a website.
2. Find relevant Reddit threads related to that website's problem space.
3. Generate tailored reply suggestions for those threads.

ThreadScout is designed for human-in-the-loop outreach, not automated spam posting.

## Table of Contents

- [Why ThreadScout](#why-threadscout)
- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [UI Behavior](#ui-behavior)
- [Troubleshooting](#troubleshooting)
- [Responsible Usage](#responsible-usage)
- [Scripts](#scripts)

## Why ThreadScout

Most outreach tools optimize for volume. ThreadScout optimizes for relevance:

- It starts from your website content, not random keyword lists.
- It focuses on high-intent Reddit discussions.
- It drafts context-aware responses instead of generic templates.

## Features

- Website crawling with lightweight content extraction.
- LLM-based positioning summary + search term generation.
- Reddit thread discovery through Exa.
- Contextual reply generation for selected threads.
- Provider fallback for resilience:
	- Primary: Gemini
	- Fallback: Groq (if Gemini fails or is unavailable)
- Clean UI output with:
	- Subreddit tags
	- Match reasoning
	- Reply copy button
	- Direct link to original thread
- Keyboard UX: pressing Enter in URL input submits the form.

## How It Works

Main orchestration route: `app/api/route.ts`

1. Validate the incoming URL.
2. Crawl website pages via `app/api/crawl/route.ts`.
3. Extract a concise description + Reddit search terms via `app/api/LLM/route.ts`.
4. Search Reddit threads via `app/api/reddit-search/route.ts`.
5. Draft replies via `app/api/GenLLM/route.ts`.
6. Enrich reply output with thread links and normalized subreddit metadata.
7. Return a single response payload to the frontend.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Exa SDK (`exa-js`) for Reddit discovery
- Google GenAI SDK (`@google/genai`)
- Groq Chat Completions API (fallback provider)
- Axios + Cheerio for crawling and parsing page content

## Project Structure

```text
app/
	page.tsx                     # UI: URL input, submit flow, generated post cards
	api/
		route.ts                   # Orchestrates the full pipeline
		crawl/route.ts             # Crawls website pages and extracts text
		LLM/route.ts               # Generates description + search terms (Gemini -> Groq fallback)
		reddit-search/route.ts     # Finds Reddit threads using Exa
		GenLLM/route.ts            # Generates reply drafts (Gemini -> Groq fallback)
```

## Environment Variables

Create a `.env.local` file in project root.

```env
# GitHub OAuth for NextAuth
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_long_random_secret

# Required for Reddit thread search
EXA_API_KEY=your_exa_api_key

# Primary LLM provider
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Fallback LLM provider (used when Gemini fails)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

### Provider behavior

- If Gemini works, Gemini is used.
- If Gemini fails and `GROQ_API_KEY` exists, request retries on Groq.
- If neither provider is available, endpoints return an error.

### GitHub OAuth setup

1. Create a GitHub OAuth App in GitHub Developer Settings.
2. Set the callback URL to `http://localhost:3000/api/auth/callback/github` for local development.
3. Copy the app's Client ID and Client Secret into `GITHUB_ID` and `GITHUB_SECRET`.
4. Generate a strong `NEXTAUTH_SECRET` and keep it stable between restarts.
5. Restart the dev server after updating `.env.local`.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Add `.env.local` with the variables above.

### 3. Run development server

```bash
npm run dev
```

### 4. Open app

Visit `http://localhost:3000`.

## API Reference

### `POST /api`

Run full workflow from URL to final suggested posts.

Request body:

```json
{
	"url": "https://example.com"
}
```

Success response shape:

```json
{
	"success": true,
	"pages": [],
	"description": "...",
	"searchTerms": ["..."],
	"finalPosts": [
		{
			"post_id": "...",
			"subreddit": "r/example",
			"reasoning": "...",
			"reply_content": "...",
			"threadUrl": "https://www.reddit.com/..."
		}
	]
}
```

### `GET /api?url=...`

Same as `POST /api`, query-string based entry point.

### `GET /api/crawl?url=...`

Returns crawled page content summary used by downstream LLM stages.

### `POST /api/LLM`

Input: crawled pages.

Output:

- `description`: concise value proposition/problem framing
- `searchTerms`: up to 5 Reddit-intent search phrases

### `POST /api/reddit-search`

Input:

```json
{
	"keywords": ["term 1", "term 2"],
	"description": "optional context"
}
```

Output: array of normalized Reddit candidates:

```json
[
	{
		"id": "...",
		"title": "...",
		"text": "...",
		"subreddit": "r/example",
		"threadUrl": "https://www.reddit.com/...",
		"isExternal": false
	}
]
```

### `POST /api/GenLLM`

Input:

- `reddit_json`: candidate Reddit posts
- `websiteData`: `{ description, url }`

Output: suggested reply objects with reasoning and copy-ready text.

## UI Behavior

Home page (`app/page.tsx`) includes:

- URL input with Enter-to-submit support
- Loading and error states
- Campaign result cards showing:
	- subreddit
	- matching rationale
	- generated reply
	- one-click copy
	- source thread link

## Troubleshooting

### `Missing EXA_API_KEY`

Set `EXA_API_KEY` in `.env.local` and restart dev server.

### `Missing GEMINI_API_KEY and GROQ_API_KEY`

At least one LLM provider key is required. For failover, configure both.

### Groq fallback is not triggering

Check that:

- `GROQ_API_KEY` is set
- outbound network calls are allowed
- Groq model name in `GROQ_MODEL` is valid

### Empty or weak results

- Improve source website clarity (title, description, body copy).
- Try narrower niche URLs.
- Verify crawl output from `/api/crawl` contains meaningful text.

## Responsible Usage

- Review every generated reply before posting.
- Follow subreddit rules and Reddit platform policies.
- Prioritize helpfulness over promotion.
- Avoid repetitive or automated posting patterns.

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - run ESLint

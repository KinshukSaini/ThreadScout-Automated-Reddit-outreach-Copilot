import { NextRequest, NextResponse } from "next/server";
import { Exa } from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

type RedditPostData = {
  id: string;
  title: string;
  text: string;
  subreddit: string;
  threadUrl: string;
  isExternal: boolean;
};

type RedditSearchResponse = {
  data: {
    children: Array<{
      data: RedditPostData;
    }>;
  };
};

function mapExaResults(results: Array<{ id: string; title?: string | null; url?: string | null; text?: string | null; highlights?: string[] | null }>) {
  return results.map((item) => ({
    id: item.id,
    title: item.title ?? "",
    text: typeof item.text === "string"
      ? item.text
      : Array.isArray(item.highlights)
        ? item.highlights.join(" ")
        : "",
    subreddit: extractSubredditFromUrl(item.url ?? ""),
    threadUrl: item.url ?? "",
    isExternal: false,
  }));
}

async function searchRedditFallback(searchSeed: string) {
  const query = searchSeed
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join(" OR ");

  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=5`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 ThreadScout/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit fallback failed with status ${response.status}`);
  }

  const json = (await response.json()) as RedditSearchResponse;
  return json.data.children.map((child) => {
    const post = child.data;

    return {
      id: post.id,
      title: post.title,
      text: post.text,
      subreddit: post.subreddit,
      threadUrl: post.threadUrl,
      isExternal: post.isExternal,
    };
  });
}

export async function POST(request: NextRequest) {
  let body: { keywords?: unknown; Description?: unknown; description?: unknown };

  try {
    body = (await request.json()) as {
      keywords?: unknown;
      Description?: unknown;
      description?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const keywords = Array.isArray(body.keywords)
    ? body.keywords.filter((keyword): keyword is string => typeof keyword === "string")
    : [];

  const description = typeof body.description === "string"
    ? body.description
    : typeof body.Description === "string"
      ? body.Description
      : "";

  if (keywords.length === 0 && !description) {
    return NextResponse.json({ error: "keywords are required" }, { status: 400 });
  }

  if (!process.env.EXA_API_KEY) {
    return NextResponse.json({ error: "Missing EXA_API_KEY" }, { status: 500 });
  }

  const searchSeed = description || keywords.join(", ");
  const searchIntent = `${searchSeed} site:reddit.com`;

  try {
    const result = await exa.search(searchIntent, {
      includeDomains: ["reddit.com", "www.reddit.com"],
      type: "auto",
      contents: {
        text: true,
        highlights: {
          numSentences: 3,
        },
      },
      numResults: 10,
    });

    console.log("Exa Search Result:", result);
    const postsForAI = mapExaResults(result.results ?? []);

    if (postsForAI.length === 0) {
      return NextResponse.json(await searchRedditFallback(searchSeed));
    }

    return NextResponse.json(postsForAI);
  } catch (error) {
    try {
      return NextResponse.json(await searchRedditFallback(searchSeed));
    } catch (fallbackError) {
      const message = fallbackError instanceof Error ? fallbackError.message : "Failed to search Reddit threads";
      console.error("reddit-search failed:", message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }
  
  // const postsForAI = json.data.children.map((child) => {
  //   const post = child.data;

  //   return {
  //     id: post.id,
  //     title: post.title,
  //     text: post.selftext,
  //     subreddit: post.subreddit_name_prefixed,
  //     // This is the direct link to the thread for your browser
  //     threadUrl: `https://www.reddit.com${post.permalink}`,
  //     // This tells you if the post is actually just a link to another site
  //     isExternal: post.is_self === false
  //   };
  // });

  // return NextResponse.json(postsForAI);

}

function extractSubredditFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(/\/r\/([^/]+)/i);
    return match ? `r/${match[1]}` : "r/reddit";
  } catch {
    return "r/reddit";
  }
}






// import { NextRequest, NextResponse } from "next/server";

// type RedditPostData = {
//   id: string;
//   title: string;
//   selftext: string;
//   subreddit_name_prefixed: string;
//   permalink: string;
//   is_self: boolean;
// };

// type RedditSearchResponse = {
//   data: {
//     children: Array<{
//       data: RedditPostData;
//     }>;
//   };
// };

// export async function POST(request : NextRequest) {
// const { keywords } = await request.json();

// // 1. Remove quotes around the phrases
// // 2. Wrap each phrase in parentheses to group the terms
// // 3. Join with ' OR '
// const query = keywords
//   .map((p : string) => `(${p})`) 
//   .join(' OR ');

// const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=top&limit=5`;

//   console.log("The final URL : ", url);

//   const result = await fetch(url, {
//     headers: {
//       // Always use a unique User-Agent so you don't get 429'd
//       'User-Agent': 'my-app/app/api/reddit-search my-app/app/api/reddit-search/route.ts by /u/quieteGaze'
//     }
//   });

//   if (!result.ok) {
//     return NextResponse.json(
//       { error: "Failed to fetch Reddit posts" },
//       { status: result.status }
//     );
//   }

//   const json = (await result.json()) as RedditSearchResponse;

//     const postsForAI = json.data.children.map((child) => {
//         const post = child.data;

//         return {
//             id: post.id,
//             title: post.title,
//             text: post.selftext,
//             subreddit: post.subreddit_name_prefixed,
//             // This is the direct link to the thread for your browser
//             threadUrl: `https://www.reddit.com${post.permalink}`,
//             // This tells you if the post is actually just a link to another site
//             isExternal: post.is_self === false 
//         };
//     });

//   return NextResponse.json(postsForAI);

// }
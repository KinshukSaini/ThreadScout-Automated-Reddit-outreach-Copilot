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
  const searchIntent = `People on Reddit asking for recommendations or complaining about: ${searchSeed}. Find me the most recent Reddit threads where people are asking for recommendations or complaining about ${searchSeed}. Be sure to now take the posts that already talking about the specific website the campaign is about. I only want posts that are asking for recommendations or complaining about the topic.`;

  try {
    const result = await exa.search(searchIntent, {
      includeDomains: ["reddit.com"],
      type: "auto",
      contents: {
        text: true,
        highlights: {
          numSentences: 3,
        },
      },
      numResults: 3,
    });

    console.log("Exa Search Result:", result);
    const postsForAI = result.results.map((item) => ({
      id: item.id,
      title: item.title ?? "",
      text: "text" in item && typeof item.text === "string"
        ? item.text
        : "highlights" in item && Array.isArray(item.highlights)
          ? item.highlights.join(" ")
          : "",
      subreddit: extractSubredditFromUrl(item.url),
      threadUrl: item.url,
      isExternal: false,
    }));

    return NextResponse.json(postsForAI);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search Reddit threads";
    console.error("reddit-search failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
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
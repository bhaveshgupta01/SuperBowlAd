import { NextRequest, NextResponse } from "next/server";
import { addPost, setActivePostId, getPosts } from "@/lib/store";

// Without this, next build prerenders GET as a static empty list.
export const dynamic = "force-dynamic";

/**
 * GET /api/posts — List all posts (for grid).
 */
export async function GET() {
  const posts = getPosts();
  return NextResponse.json({ posts });
}

/**
 * POST /api/posts — Create a post (simulated "Post to Instagram").
 * Body: { eventId, eventDescription, caption, prompt, imageUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, eventDescription, caption, prompt, imageUrl } = body;

    if (!eventId || !eventDescription || !caption || !prompt) {
      return NextResponse.json(
        { error: "Missing eventId, eventDescription, caption, or prompt" },
        { status: 400 }
      );
    }

    const postedAt = Math.floor(Date.now() / 1000);
    const post = addPost({
      eventId,
      eventDescription,
      caption,
      prompt,
      postedAt,
      imageUrl: imageUrl || undefined,
    });

    setActivePostId(post.id);

    return NextResponse.json({ post });
  } catch (e) {
    console.error("Create post error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

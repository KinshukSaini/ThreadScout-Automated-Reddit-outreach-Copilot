import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all scouts for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      console.log("No session or email found", { session: !!session, email: session?.user?.email });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Fetching scouts for email:", session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { scouts: true },
    });

    if (!user) {
      console.log("User not found in database for email:", session.user.email);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ scouts: user.scouts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching scouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scouts", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}

// POST - Create a new scout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      console.log("No session for POST", { session: !!session, email: session?.user?.email });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, url } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    const scoutId = crypto.randomUUID();
    const userEmail = session.user.email.toLowerCase();

    console.log("Creating scout for email:", userEmail);

    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { scouts: true, id: true },
    });

    console.log("Existing user found:", !!existingUser, { id: existingUser?.id });

    if (!existingUser) {
      // Try to create the user if they don't exist
      console.log("User not found, attempting to create...");
      return NextResponse.json(
        { error: "User profile not found. Please sign out and sign in again." },
        { status: 404 }
      );
    }

    const user = await prisma.user.update({
      where: { email: userEmail },
      data: {
        scouts: {
          push: {
            id: scoutId,
            name,
            description: description || "",
            url,
          },
        },
      },
      select: { scouts: true },
    });

    console.log("Scout created successfully");

    return NextResponse.json(
      { 
        message: "Scout created successfully",
        scout: user.scouts[user.scouts.length - 1],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating scout:", error);
    return NextResponse.json(
      { error: "Failed to create scout", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}

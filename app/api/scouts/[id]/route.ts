import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update a scout
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const scoutId = params.id;
    const body = await request.json();
    const { name, description, url } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { scouts: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const scoutIndex = user.scouts.findIndex((s: any) => s.id === scoutId);

    if (scoutIndex === -1) {
      return NextResponse.json(
        { error: "Scout not found" },
        { status: 404 }
      );
    }

    // Update the scout
    user.scouts[scoutIndex] = {
      ...user.scouts[scoutIndex],
      name: name ?? user.scouts[scoutIndex].name,
      description: description ?? user.scouts[scoutIndex].description,
      url: url ?? user.scouts[scoutIndex].url,
    };

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { scouts: user.scouts },
      select: { scouts: true },
    });

    return NextResponse.json(
      {
        message: "Scout updated successfully",
        scout: updatedUser.scouts[scoutIndex],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating scout:", error);
    return NextResponse.json(
      { error: "Failed to update scout" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scout
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const scoutId = params.id;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { scouts: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const scoutIndex = user.scouts.findIndex((s: any) => s.id === scoutId);

    if (scoutIndex === -1) {
      return NextResponse.json(
        { error: "Scout not found" },
        { status: 404 }
      );
    }

    // Remove the scout
    user.scouts.splice(scoutIndex, 1);

    await prisma.user.update({
      where: { email: session.user.email },
      data: { scouts: user.scouts },
    });

    return NextResponse.json(
      { message: "Scout deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting scout:", error);
    return NextResponse.json(
      { error: "Failed to delete scout" },
      { status: 500 }
    );
  }
}

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3intoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  try {
    const body = await req.json();

    const { file_key, file_name } = body;
    if (!file_key || !file_name) {
      console.error("Missing required fields:", { file_key, file_name });
      return new Response(
        JSON.stringify({ error: "Missing file_key or file_name" }),
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file_name}, key: ${file_key}`);

    const pages = await loadS3intoPinecone(file_key);
    const chat_id = await db.insert(chats).values({
      filekey: file_key,
      pdfName: file_name,
      pdfUrl: getS3Url(file_key),
      userId
    }).returning({
      insertedId: chats.id,
    });
    return NextResponse.json(
      {
        chat_id : chat_id[0].insertedId  
      },
      { status: 200  }
    )
    
  } catch (error) {
    console.error("Error in /api/create-chat handler:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}


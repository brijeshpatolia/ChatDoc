import { loadS3intoPinecone } from "@/lib/pinecone";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const { file_key, file_name } = body;
    if (!file_key || !file_name) {
      console.error("Missing required fields:", { file_key, file_name });
      return new Response(
        JSON.stringify({ error: "Missing file_key or file_name" }),
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file_name}, key: ${file_key}`);

    // Call your Pinecone logic
    const pages = await loadS3intoPinecone(file_key);

    console.log("File successfully processed with pages:", pages);

    return new Response(JSON.stringify({ pages }), { status: 200 });
  } catch (error) {
    console.error("Error in /api/create-chat handler:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

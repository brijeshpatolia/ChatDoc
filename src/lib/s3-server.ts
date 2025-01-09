import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

export async function downloadFromS3(file_key: string) {
  try {
    console.log("Initializing AWS S3 for download...");

    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
    });

    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
    };

    console.log("Attempting to download file from S3 with params:", params);

    // Fetch the object from S3
    const obj = await s3.getObject(params).promise();

    if (!obj.Body) {
      throw new Error("The file body is empty or unavailable.");
    }

    console.log("File successfully fetched from S3.");

    // Use Vercel's writable /tmp directory
    const tmpDir = "/tmp"; // Use Vercel's /tmp directory
    const file_name = path.join(tmpDir, `pdf-${Date.now()}.pdf`);

    // Ensure the /tmp directory exists (on most platforms, /tmp should exist)
    if (!fs.existsSync(tmpDir)) {
      console.log("Creating /tmp directory...");
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Write the file to the /tmp directory
    fs.writeFileSync(file_name, obj.Body as Buffer);
    console.log(`File successfully downloaded and saved to ${file_name}`);

    return file_name;
  } catch (error) {
    console.error("Error downloading or saving the file from S3:", error);

    // Provide more context for debugging
    console.log("File key:", file_key);
    console.log("Bucket:", process.env.NEXT_PUBLIC_S3_BUCKET_NAME);
    console.log("AWS Region:", process.env.AWS_REGION);

    return null;
  }
}

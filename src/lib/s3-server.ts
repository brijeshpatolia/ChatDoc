import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

export async function downloadFromS3(file_key: string) {
  try {
    // Update AWS configuration
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
      region: "ap-southeast-1",
    });

    const s3 = new AWS.S3();

    // Define parameters for the S3 getObject method
    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
    };

    // Fetch the object from S3
    const obj = await s3.getObject(params).promise();

    if (!obj.Body) {
      throw new Error("The file body is empty or unavailable.");
    }

    // Define the local file directory and file path
    const tmpDir = path.join(process.cwd(), "tmp"); // Current directory 'tmp' folder
    const file_name = path.join(tmpDir, `pdf-${Date.now()}.pdf`);

    // Ensure the tmp directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Write the file to the local filesystem
    fs.writeFileSync(file_name, obj.Body as Buffer);

    console.log(`File successfully downloaded and saved to ${file_name}`);
    return file_name;
  } catch (error) {
    console.error("Error downloading or saving the file from S3:", error);
    return null;
  }
}

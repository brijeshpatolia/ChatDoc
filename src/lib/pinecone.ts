import { Pinecone  } from "@pinecone-database/pinecone";

import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  RecursiveCharacterTextSplitter,
  Document,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import md5 from "md5";
import { Vector } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_data";
import { convertToAscii } from "./utils";

let pinecone: Pinecone | null = null;

type PineconeRecord = {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
};

export const getPineconeClient = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
};

type PDFpage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3intoPinecone(fileKey: string ) {
  try {
    console.log("Downloading file from S3...");
    const file_name = await downloadFromS3(fileKey);
    if (!file_name) {
      console.error("Failed to download file from S3");
      return;
    }

    const loader = new PDFLoader(file_name);
    const pages = (await loader.load()) as PDFpage[];

    console.log(`Loaded ${pages.length} pages from the PDF.`);
    const documents = await Promise.all(pages.map(prepareDocument));
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    const client = await getPineconeClient();
    const pineconeIndex = client.index("pdf-licker");

    console.log("Uploading vectors to Pinecone...");
    const namespace = convertToAscii(fileKey);

    // Ensure compatibility with Pinecone API
    const pineconeVectors: PineconeRecord[] = vectors.map((vector) => ({
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata as Record<string, string | number | boolean>, // Ensure metadata is flat and typed
    }));
    
    await pineconeIndex.namespace(namespace).upsert(pineconeVectors);


    console.log("Documents successfully uploaded to Pinecone.");
    return documents[0];
  } catch (error) {
    console.error("Error processing and uploading to Pinecone:", error);
    throw error;
  }
}





async function embedDocument(doc: Document): Promise<Vector> {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    // Flatten metadata to adhere to Pinecone's requirements
    const metadata = {
      text: doc.metadata.text, // Truncate if necessary
      pageNumber: doc.metadata.pageNumber,
    };

    return {
      id: hash,
      values: embeddings,
      metadata, // Ensure this is flat
    };
  } catch (error) {
    console.error("Error embedding document:", error);
    throw error;
  }
}


export const truncateStringByBytes = (str: string, bytes: number): string => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFpage) {
  // eslint-disable-next-line prefer-const
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");

  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);

  return docs;
}

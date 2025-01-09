/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pinecone } from "@pinecone-database/pinecone";
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
    console.log("Initializing Pinecone client...");
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    console.log("Pinecone client initialized.");
  }
  return pinecone;
};

type PDFpage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3intoPinecone(fileKey: string) {
  try {
    console.log(`Starting process for file key: ${fileKey}`);

    // Step 1: Download file from S3
    console.log("Downloading file from S3...");
    const file_name = await downloadFromS3(fileKey);
    if (!file_name) {
      console.error("Failed to download file from S3");
      return;
    }
    console.log(`File downloaded from S3: ${file_name}`);

    // Step 2: Load and parse the PDF
    const loader = new PDFLoader(file_name);
    console.log("Loading PDF content...");
    const pages = (await loader.load()) as PDFpage[];
    console.log(`Loaded ${pages.length} pages from the PDF.`);

    // Step 3: Prepare and split documents
    console.log("Preparing documents from pages...");
    const documents = await Promise.all(pages.map(prepareDocument));
    const documentChunks = documents.flat();
    console.log(`Prepared ${documentChunks.length} document chunks.`);

    // Step 4: Generate embeddings for document chunks
    console.log("Generating embeddings for document chunks...");
    const vectors = await Promise.all(documentChunks.map(embedDocument));
    console.log(`Generated ${vectors.length} embeddings.`);

    // Step 5: Initialize Pinecone client and namespace
    const client = await getPineconeClient();
    const pineconeIndex = client.index("pdf-licker");

    const namespace = convertToAscii(fileKey);
    console.log(`Using Pinecone namespace: ${namespace}`);

    // Step 6: Prepare vectors for upsert
    const pineconeVectors: PineconeRecord[] = vectors.map((vector) => ({
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata as Record<string, string | number | boolean>,
    }));
    console.log(`Prepared ${pineconeVectors.length} vectors for upsert.`);

    // Step 7: Upload vectors to Pinecone in batches
    const batchSize = 50; // Adjust batch size as needed
    for (let i = 0; i < pineconeVectors.length; i += batchSize) {
      const batch = pineconeVectors.slice(i, i + batchSize);
      console.log(`Uploading batch ${i / batchSize + 1} with ${batch.length} vectors...`);
      await retryUpsert(pineconeIndex, namespace, batch);
    }

    console.log("All vectors successfully uploaded to Pinecone.");
    return documents[0];
  } catch (error) {
    console.error("Error processing and uploading to Pinecone:", error);
    throw error;
  }
}

async function retryUpsert(
  pineconeIndex: any,
  namespace: string,
  batch: PineconeRecord[],
  retries = 3
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pineconeIndex.namespace(namespace).upsert(batch);
      console.log("Batch uploaded successfully.");
      return;
    } catch (error) {
      console.error(`Upsert failed on attempt ${attempt}:`, error);
      if (attempt === retries) throw error;
    }
  }
}

async function embedDocument(doc: Document): Promise<Vector> {
  try {
    console.log("Generating embeddings for document:", doc.pageContent.slice(0, 100)); // Preview first 100 characters
    const embeddings = await getEmbeddings(doc.pageContent);
    console.log(`Embedding size: ${embeddings.length}`);
    const hash = md5(doc.pageContent);
    console.log(`Generated hash for document: ${hash}`);

    const metadata = {
      text: typeof doc.metadata.text === 'string' ? doc.metadata.text.slice(0, 500) : '', // Limit text metadata to 500 characters
      pageNumber: doc.metadata.pageNumber,
    };

    console.log(`Metadata for document:`, metadata);

    return {
      id: hash,
      values: embeddings,
      metadata,
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
  try {
    console.log(`Preparing page: ${page.metadata.loc.pageNumber}`);
    const { metadata } = page;
    let { pageContent } = page;
    pageContent = pageContent.replace(/\n/g, "");
    console.log("Cleaned page content:", pageContent.slice(0, 100)); // Preview first 100 characters

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
    console.log(`Split page into ${docs.length} document chunks.`);
    return docs;
  } catch (error) {
    console.error("Error preparing document from page:", error);
    throw error;
  }
}

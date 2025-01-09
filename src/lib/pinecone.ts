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

    console.log("Downloading file from S3...");
    const file_name = await downloadFromS3(fileKey);
    if (!file_name) {
      console.error("Failed to download file from S3");
      return;
    }
    console.log(`File downloaded from S3: ${file_name}`);

    const loader = new PDFLoader(file_name);
    console.log("Loading PDF content...");
    const pages = (await loader.load()) as PDFpage[];

    console.log(`Loaded ${pages.length} pages from the PDF.`);
    console.log("Preparing documents from pages...");
    const documents = await Promise.all(pages.map(prepareDocument));
    console.log(`Prepared ${documents.flat().length} document chunks.`);

    console.log("Generating embeddings for document chunks...");
    const vectors = await Promise.all(documents.flat().map(embedDocument));
    console.log(`Generated ${vectors.length} embeddings.`);

    const client = await getPineconeClient();
    const pineconeIndex = client.index("pdf-licker");

    console.log("Uploading vectors to Pinecone...");
    const namespace = convertToAscii(fileKey);
    console.log(`Using namespace: ${namespace}`);

    const pineconeVectors: PineconeRecord[] = vectors.map((vector) => ({
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata as Record<string, string | number | boolean>,
    }));

    console.log("Pinecone vectors ready for upload:", pineconeVectors);

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
    console.log("Generating embeddings for document:", doc.pageContent.slice(0, 100)); // Preview first 100 characters
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);
    console.log(`Generated hash for document: ${hash}`);

    const metadata = {
      text: doc.metadata.text,
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

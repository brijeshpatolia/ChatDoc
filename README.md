# 📄 ChatDoc – AI-Powered Document Assistant

ChatDoc is an AI-powered document assistant that lets users upload PDF files and interact with them through a natural chat interface. It extracts content from uploaded documents, generates vector embeddings, and uses OpenAI's GPT to answer questions based strictly on the document's context.

---

## 🚀 Features

- 🧠 **Chat With Your PDFs** — Ask questions and get accurate, context-aware answers.
- 📄 **PDF Upload Support** — Upload multi-page documents for processing.
- 🪄 **AI-Powered Answers** — Uses OpenAI's `gpt-3.5-turbo` for conversational responses.
- 🧷 **RAG-Based Context Retrieval** — Embeds content and fetches relevant chunks using Pinecone.
- 🧾 **Subscription Billing** — Integrated with Stripe for managing user subscriptions.
- 💬 **Real-Time Chat** — Streaming responses using `ai` SDK.
- ☁️ **S3 File Storage** — Files stored securely on AWS S3.
- 📦 **Embeddings with OpenAI** — Uses `text-embedding-ada-002` for vector search.

---

## 🛠️ Tech Stack

### ⚙️ Backend
- **Next.js 14 App Router**
- **TypeScript**
- **Edge Functions**
- **Drizzle ORM + PostgreSQL**
- **Stripe** for subscriptions
- **AWS S3** for storage
- **Pinecone** for vector search
- **OpenAI API** (Chat + Embeddings)

### 🌐 Frontend
- **Next.js**
- **Tailwind CSS**
- **React** with hooks

---

## 🧩 Architecture Overview

1. **User uploads a PDF** → Saved to S3
2. **PDF parsed** using LangChain
3. **Chunks created** using `RecursiveCharacterTextSplitter`
4. **Embeddings generated** → Stored in Pinecone
5. **User asks a question**
6. **Query is embedded** and top matching chunks are retrieved
7. **Chunks + message history** sent to OpenAI for generating a response
8. **Messages streamed** back to user and saved in DB

---

## 🧪 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/your-username/chatdoc.git
cd chatdoc
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file with:
```env
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SIGNING_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
NEXT_PUBLIC_S3_BUCKET_NAME=your_bucket_name
PINECONE_API_KEY=your_pinecone_key
```

### 4. Start the dev server
```bash
npm run dev
```

---

## 🧾 Example Use Case

Upload a research paper and ask:
> "What was the conclusion of this study?"

ChatDoc will:
- Embed your question
- Search for the most relevant parts of the paper
- Use GPT to respond only based on those parts

---

## 📬 Webhook Setup

If you're using Stripe, run the Stripe CLI to test locally:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

---

## 🧠 Learning Resources Used
- [LangChain PDFLoader](https://js.langchain.com/docs/modules/indexes/document_loaders/integrations/file_loaders/pdf)
- [Pinecone Vector Search](https://docs.pinecone.io/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Stripe Checkout + Webhooks](https://stripe.com/docs)

---

## 🛡️ Security
- Webhook signature verification
- PDF content is processed and stored securely
- Authenticated access via Clerk

---

## 🙌 Author

Developed by [Brijesh Patolia](https://github.com/brijeshpatolia)

If you like this project, give it a ⭐ on GitHub and feel free to contribute or reach out!

---

## 📄 License

MIT License


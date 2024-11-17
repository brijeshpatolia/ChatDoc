import ChatComponent from "@/components/ui/ChatComponent";
import ChatSideBar from "@/components/ui/ChatSidebar";
import PDFViewer from "@/components/ui/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";

import { auth } from "@clerk/nextjs/server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

type Params = Promise<{ chatId: string }>;

const ChatPage = async (props: { params: Params }) => {
  const { chatId } = await props.params; // Await `params` before destructuring

  const parsedChatId = parseInt(chatId, 10);
  if (isNaN(parsedChatId)) {
    return redirect("/");
  }

  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  if (!_chats || _chats.length === 0) {
    return redirect("/");
  }

  const currentChat = _chats.find((chat) => chat.id === parsedChatId);
  if (!currentChat) {
    return redirect("/");
  }

  return (
    <div className="flex max-h-screen">
      <div className="flex w-full max-h-screen">
        {/* Chat Sidebar */}
        <div className="flex-[1] max-w-xs">
          <ChatSideBar chats={_chats} chatId={parsedChatId} isPro={false} />
        </div>

        {/* PDF Viewer */}
        <div className="flex-[5] max-h-screen p-4">
          <PDFViewer pdf_url={currentChat.pdfUrl || ""} />
        </div>

        {/* Chat Component */}
        <div className="flex-[3] border-l-4 border-l-slate-200">
          <ChatComponent chatId={parsedChatId} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

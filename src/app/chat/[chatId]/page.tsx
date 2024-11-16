import ChatComponent from "@/components/ui/ChatComponent";
import ChatSideBar from "@/components/ui/ChatSidebar";
import PDFViewer from "@/components/ui/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";

import { auth } from "@clerk/nextjs/server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

type Props = {
  params: {
    chatId: string;
  };
};

const ChatPage = async (props: Props) => {
  const { params } = props; // Access `params` synchronously
  const chatId = params.chatId; // Destructure `chatId` synchronously

  // Authenticate the user asynchronously
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  // Fetch user chats from the database
  const _chats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId));

  if (!_chats || _chats.length === 0) {
    return redirect("/");
  }

  // Check if the current chat exists
  const currentChat = _chats.find((chat) => chat.id === parseInt(chatId));
  if (!currentChat) {
    return redirect("/");
  }

  return (
    <div className="flex max-h-screen">
      <div className="flex w-full max-h-screen">
        {/* Chat Sidebar */}
        <div className="flex-[1] max-w-xs">
          <ChatSideBar chats={_chats} chatId={parseInt(chatId)} />
        </div>

        {/* PDF Viewer */}
        <div className="flex-[5] max-h-screen p-4">
          {/* Placeholder for PDF Viewer */}
          <PDFViewer pdf_url={currentChat?.pdfUrl || ""} />
        </div>

        {/* Chat Component */}
        <div className="flex-[3] border-l-4 border-l-slate-200">
          {/* Placeholder for Chat Component */}
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

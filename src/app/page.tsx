import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

import { checkSubscription } from "@/lib/subscription";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import SubscriptionButton from "@/components/ui/SubscriptionButton";
import FileUpload from "@/components/ui/FileUpload";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  const isPro = await checkSubscription();
  let firstChat;
  if (userId) {
    firstChat = await db.select().from(chats).where(eq(chats.userId, userId));
    if (firstChat) {
      firstChat = firstChat[0];
    }
  }

  const userButtonAppearance = {
    elements: {
      userButtonAvatarBox: "w-10 h-10", // Custom width and height
      userButtonPopoverCard: "bg-blue-100", // Custom background for the popover card
      userButtonPopoverActionButton: "text-red-600", // Custom text color for action buttons
    },
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-gray-100 to-gray-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-4 text-6xl font-semibold">chat with any document</h1>
            <UserButton appearance={userButtonAppearance} />
          </div>

          <div className="flex mt-5">
            {isAuth && firstChat ? (
              <>
                <Link href={`/chat/${firstChat.id}`}>
                  <Button>
                    Go to Chats <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <div className="ml-3">
                  <SubscriptionButton isPro={isPro} />
                </div>
              </>
            ) : (
              <Link href="/sign-in">
                <Button>
                  Login to get Started!
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>

          <p className="max-w-xl mt-3 text-xl text-slate-600">
            Join millions of students, researchers and professionals to instantly
            answer questions and understand research with AI
          </p>

          <div className="w-full mt-4">
            {isAuth ? <FileUpload /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

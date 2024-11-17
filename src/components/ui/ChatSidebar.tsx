"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./button";
import { MessageCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import SubscriptionButton from "./SubscriptionButton";
import toast from "react-hot-toast";


type Props = {
  chats: DrizzleChat[];
  chatId: number;
  isPro: boolean;
};

const ChatSideBar = ({ chats, chatId, isPro }: Props) => {
  const [loading, setLoading] = React.useState(false);
  const handleSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/stripe");
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No URL returned from API");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to process the subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full h-screen   text-gray-200 bg-gray-900">
      <Link href="/">
        <Button className="w-full border-dashed border-white border">
          <PlusCircle className="mr-2 w-4 h-4" />
          New Chat
        </Button>
      </Link>

      <div className="flex h-screen  flex-col gap-2 mt-4">
        {chats.map((chat) => (
          <Link key={chat.id} href={`/chat/${chat.id}`}>
            <div
              className={cn("rounded-lg  text-slate-300 flex items-center", {
                "bg-blue-600 text-white": chat.id === chatId,
                "hover:text-white": chat.id !== chatId,
              })}
            >
              <MessageCircle className="mr-2" />
              <p className="w-full  text-sm truncate whitespace-nowrap text-ellipsis">
                {chat.pdfName}
              </p>
            </div>
          </Link>
        ))}
        
      </div>

      <div className="absolute bottom-4 left-4">
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <Link href="/" className="text-blue-500 hover:underline">
          Home
        </Link>
        <Link href="/source" className="text-blue-500 hover:underline">
          Source
        </Link>
      </div>
      <Button
        className="mt-2 text-white bg-slate-700 hover:bg-slate-800 disabled:bg-slate-500"
        disabled={loading}
        onClick={handleSubscription}
      >
        {loading ? "Processing..." : "Upgrade to Pro!"}
      </Button>
     
    </div>
    </div>
  );
};

export default ChatSideBar;
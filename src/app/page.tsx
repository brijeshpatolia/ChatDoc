import { Button } from "@/components/ui/button";
import FileUpload from "@/components/ui/FileUpload";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";


export default  async function Home() {
  const {userId, redirectToSignIn } =  await auth();
  if (!userId){
    return redirectToSignIn();
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
            <h1 className="mr-4 text-6xl font-semibold">Lick any PDF</h1>
            <UserButton appearance={userButtonAppearance} />
          </div>

          <div className="flex mt-5">
            <Button>Go to Chats</Button>
          </div>

          <p className="max-w-xl mt-3 text-xl text-slate-600">
            Join millions of students, researchers and professionals to instantly
            answer questions and understand research with AI
          </p>
          <div className="w-full mt-4">
            <FileUpload />
          </div>
         
        </div>
      </div>
    </div>
  );
}

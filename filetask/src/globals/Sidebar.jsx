"use client";
import { User, PlusCircleIcon, MenuIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { extensions } from "@/assets/static";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createChat, uploadDocument } from "@/firebase/utils";
import { apiCall, geminiApiCall } from "@/functions/api-call";
import { RotatingLines } from "react-loader-spinner";
import { getChatsByUser } from "@/firebase/utils";
import { checkExistingChat } from "@/firebase/utils";
import { useToast } from "@/components/ui/use-toast";

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
};

const ProfileCard = ({ name, email, pfp }) => {
  return (
    <div className="flex p-4 rounded-xl bg-light-bg items-center gap-3">
      <Avatar>
        <AvatarImage src={pfp} alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <div className="ml-2">
        <p className="text-lg text-white font-primary tracking-wide">{name}</p>
        <p className="text-sm text-gray-400 tracking-wide">{email}</p>
      </div>
    </div>
  );
};

export function ChatCard({ icon, title, href, sourceId, type }) {
  const router = useRouter();
  let link = "";
  if (type === "large") {
    link = `/chats/largeFile/${href}`;
  } else {
    link = `/chats/${href}/${sourceId}`;
  }
  return (
    <div
      className="p-3 gap-3 flex items-center rounded-xl my-2 cursor-pointer hover:bg-light-bg transition"
      onClick={() => router.push(link)}
    >
      <Image src={icon} width={24} height={24} className="" />
      <p className="text-[16px] tracking-wide text-white">{title}</p>
    </div>
  );
}

const options = [
  {
    title: "Clear all conversations",
    icon: "/trash-icon.svg",
  },
  {
    title: "Settings",
    icon: "/settings.svg",
  },
  {
    title: "Help",
    icon: "/help-ic.svg",
  },
];

function Loader() {
  return (
    <RotatingLines
      strokeColor="white"
      strokeWidth="3"
      animationDuration="0.75"
      width="30"
      visible={true}
    />
  );
}

export const CustomButton = ({ icon, text, onClick, className }) => {
  return (
    <Button
      className={`bg-secondary text-white my-5 text-lg py-5 flex gap-2 items-center justify-start hover:bg-green-700 ${className}`}
      variant="secondary"
      size="sm"
      onClick={onClick}
    >
      {icon}
      <p className="text-[16px] tracking-wide">{text}</p>
    </Button>
  );
};

const Sidebar = () => {
  const isMobile = useMediaQuery("(max-width: 960px)");
  const user = useUser();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [sourceId, setSourceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [icon, setIcon] = useState("/upload.svg");
  const [userChats, setUserChats] = useState([]);

  const { toast } = useToast();

  useEffect(() => {
    if (user.user) {
      const getChats = async () => {
        const chats = await getChatsByUser(user.user.id);
        setUserChats(chats);
        console.log("Chats:", chats);
      };
      getChats();
    }
  }, [user.user]);

  const handleFileUpload = async (e) => {
    setLoading(true);
    const file = e.target.files[0];
    setFile(file);
    try {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Large File Detected: Upload may take some time",
          description: "Please be patient while we process your file",
          className: "bg-yellow-500 text-white",
        });
        const result = await geminiApiCall(file);
        setSummary(result);
      } else {
        const sId = await apiCall(file);
        setSourceId(sId);
        console.log("Source ID:", sId);
      }

      const ext = getFileExtension(file?.name);
      setIcon(extensions[ext] || "/upload.svg");
      toast({
        title: "File Uploaded",
        description: "File uploaded successfully",
        className: "bg-green-500 text-white",
      });
      handleChat(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Error uploading file",
        className: "bg-red-500 text-white",
      });
    }
    setLoading(false);
  };

  const handleChat = async (file) => {
    console.log("Creating chat...");
    console.log("File: " , file);
    try {
      const existingChat = await checkExistingChat(user.id, file.name);
      if (existingChat) {
        toast({
          title: "Chat Exists",
          description: "Chat already exists",
          className: "bg-yellow-500 text-white",
        });
        router.push(`/chats/${existingChat}/${sourceId}`);
        return;
      }
      setLoading(true);
      const type = file.size > 20 * 1024 * 1024 ? "large" : "small";
      const newChatRef = await createChat(
        user.id,
        file.name,
        summary,
        sourceId,
        type
      );
      toast({
        title: "Chat Created",
        description: "Chat created successfully",
        className: "bg-green-500",
      });

      if (file.size > 20 * 1024 * 1024) {
        router.push(`/chats/largeFile/${newChatRef.id}`);
      } else {
        router.push(`/chats/${newChatRef.id}/${sourceId}`);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Error creating chat",
        className: "bg-red-500 text-white",
      });
    }
  };

  const getFileExtension = (filename) => {
    return filename?.split(".").pop().toLowerCase();
  };

  return (
    <>
      {!isMobile ? (
        <aside className="bg-bg text-white w-[350px] h-[100vh] p-4 spacing-y-2 flex flex-col justify-start overflow-y-auto">
          <SignedIn>
            <ProfileCard
              name={user?.user?.fullName}
              email={user?.user?.emailAddresses[0]?.emailAddress}
              pfp={user?.user?.imageUrl}
            />
          </SignedIn>
          <SignedOut>
            <div className="flex justify-between gap-2">
              <CustomButton
                icon={<User size={24} />}
                text="Sign In"
                onClick={() => router.push("/login")}
              />
              <CustomButton
                icon={<User size={24} />}
                text="Sign Up"
                onClick={() => router.push("/signup")}
              />
            </div>
          </SignedOut>
          <label
            htmlFor="create-chat-file"
            className="bg-secondary text-white my-5 text-lg py-3 flex gap-2 items-center justify-center hover:bg-green-700 cursor-pointer rounded-lg px-4"
          >
            {loading ? (
              <div className="flex justify-center items-center">
                <Loader />
              </div>
            ) : (
              <>
                <PlusCircleIcon size={24} />
                <span className="text-[16px] tracking-wide">
                  Create New Chat
                </span>
                <input
                  type="file"
                  id="create-chat-file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </>
            )}
          </label>

          <SignedIn>
            <div className="my-5">
              <h2 className="text-lg text-white font-primary">Chats</h2>
              {userChats.slice(0, 9).map((chat) => {
                const getDocIcon = (chat) => {
                  const ext = getFileExtension(chat.title);
                  return extensions[ext] || "/pdf-icon.svg";
                };
                return (
                  <ChatCard
                    key={chat.title}
                    icon={getDocIcon(chat)}
                    title={chat.title}
                    href={chat.id}
                    sourceId={chat.sourceId}
                    type={chat.type}
                  />
                );
              })}
            </div>
          </SignedIn>
          <SignedOut>
            <p className="text-lg">Log in to view chats</p>
          </SignedOut>
          <Separator className="my-4 bg-light-bg p-px" />
          <div className="my-5">
            <h2 className="text-lg text-white font-primary">Options</h2>
            {options.map((option) => (
              <ChatCard
                key={option.title}
                icon={option.icon}
                title={option.title}
              />
            ))}
            <SignedIn>
              <SignOutButton>
                <CustomButton
                  icon={<User size={24} />}
                  text="Sign Out"
                  className="w-full bg-red-500 hover:bg-red-700"
                />
              </SignOutButton>
            </SignedIn>
          </div>
        </aside>
      ) : (
        <Sheet>
          <SheetTrigger>
            <MenuIcon
              size={50}
              className="absolute top-[10px] left-[10px] text-white lg:m-2 xs:m-0"
            />
          </SheetTrigger>
          <SheetContent className="bg-bg border-none">
            <SignedIn>
              <ProfileCard
                name={user?.user?.fullName}
                email={user?.user?.emailAddresses[0]?.emailAddress}
                pfp={user?.user?.imageUrl}
              />
            </SignedIn>
            <SignedOut>
              <div className="flex justify-between gap-2">
                <CustomButton
                  icon={<User size={24} />}
                  text="Sign In"
                  onClick={() => router.push("/login")}
                />
                <CustomButton
                  icon={<User size={24} />}
                  text="Sign Up"
                  onClick={() => router.push("/signup")}
                />
              </div>
            </SignedOut>
            <div className="my-5">
              <SignedIn>
                <h2 className="text-lg text-white font-primary">Chats</h2>
                {userChats.slice(0, 5).map((chat) => {
                  const getDocIcon = (chat) => {
                    const ext = getFileExtension(chat.title);
                    return extensions[ext] || "/pdf-icon.svg";
                  };
                  return (
                    <ChatCard
                      key={chat.title}
                      icon={getDocIcon(chat)}
                      title={chat.title}
                      href={chat.id}
                      sourceId={chat.sourceId}
                    />
                  );
                })}
              </SignedIn>
              <SignedOut>
                <p className="text-lg text-white">Log in to view chats</p>
              </SignedOut>
            </div>
            <Separator className="my-4 bg-light-bg p-px" />
            <div className="my-5">
              <h2 className="text-lg text-white font-primary">Options</h2>
              {options.map((option) => (
                <ChatCard
                  key={option.title}
                  icon={option.icon}
                  title={option.title}
                />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default Sidebar;

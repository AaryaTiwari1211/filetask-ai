"use client";
import {
  User,
  PlusCircleIcon,
  MenuIcon,
  HomeIcon,
  SettingsIcon,
  DeleteIcon,
  HelpCircleIcon,
} from "lucide-react";
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
import Home from "@/app/page";

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
    <div className="flex items-center p-3 justify-between w-full rounded-xl bg-light-bg ">
      <Avatar>
        <AvatarImage src={pfp} alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <div className="w-full flex justify-center">
        <p className="text-lg text-white font-primary tracking-wide">{name}</p>
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
      className="max-w-[300px] p-3 gap-3 flex items-center rounded-xl my-2 cursor-pointer hover:bg-light-bg transition"
      onClick={() => router.push(link)}
    >
      {typeof icon === "string" ? (
        <Image src={icon} width={24} height={24} alt={`${title} icon`} />
      ) : (
        icon
      )}
      <p className="text-[16px] tracking-wide text-white">
        {title.length > 10 ? `${title.substring(0, 15)}...` : title}
      </p>
    </div>
  );
}

const options = [
  {
    title: "Home",
    icon: <HomeIcon size={24} className="text-white" />,
  },
  {
    title: "Clear all conversations",
    icon: <DeleteIcon size={24} className="text-white" />,
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
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State to control Sheet

  const { toast } = useToast();

  useEffect(() => {
    if (user.user) {
      const getChats = async () => {
        const chats = await getChatsByUser(user.user.id);
        chats.sort((a, b) => b.createdAt - a.createdAt);
        setUserChats(chats);
        console.log("Chats:", chats);
      };
      getChats();
    }
  }, [user.user , loading]);

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
    console.log("File: ", file);
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

  const handleSidebarItemClick = (link) => {
    setIsSheetOpen(false); // Close the sidebar
    router.push(link); // Navigate to the link
  };

  const [visibleChats, setVisibleChats] = useState(3);

  const loadMoreChats = () => {
    setVisibleChats((prev) => prev + 3); // Show 3 more chats when clicked
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
                onClick={() => handleSidebarItemClick("/login")}
              />
              <CustomButton
                icon={<User size={24} />}
                text="Sign Up"
                onClick={() => handleSidebarItemClick("/signup")}
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
              {userChats.slice(0, visibleChats).map((chat) => {
                const getDocIcon = (chat) => {
                  const ext = getFileExtension(chat.title);
                  return extensions[ext] || "/pdf-icon.svg";
                };
                return (
                  <ChatCard
                    key={chat.title}
                    icon={getDocIcon(chat)}
                    title={
                      chat.title.length > 10
                        ? `${chat.title.slice(0, 10)}...`
                        : chat.title
                    }
                    href={chat.id}
                    sourceId={chat.sourceId}
                    type={chat.type}
                  />
                );
              })}
              {visibleChats < userChats.length && (
                <button
                  onClick={loadMoreChats}
                  className="mt-2 text-blue-500 hover:underline"
                >
                  Load More Chats
                </button>
              )}
            </div>
          </SignedIn>
          <SignedOut>
            <p className="text-lg text-white">Log in to view chats</p>
          </SignedOut>
          <Separator className="my-4 bg-light-bg p-px" />
          <div className="my-5">
            <h2 className="text-lg text-white font-primary">Options</h2>
            {options.map((option) => (
              <ChatCard
                key={option.title}
                icon={option.icon}
                title={option.title}
                href={option.link} // Update to use the link
                onClick={() => handleSidebarItemClick(option.link)} // Handle item click
              />
            ))}
            <SignedIn>
              <SignOutButton>
                <CustomButton
                  icon={<User size={24} />}
                  text="Sign Out"
                  className="w-full bg-red-500 hover:bg-red-700"
                  onClick={() => handleSidebarItemClick("/logout")} // Handle sign out
                />
              </SignOutButton>
            </SignedIn>
          </div>
        </aside>
      ) : (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger>
            <MenuIcon
              size={30}
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
                  onClick={() => handleSidebarItemClick("/login")}
                />
                <CustomButton
                  icon={<User size={24} />}
                  text="Sign Up"
                  onClick={() => handleSidebarItemClick("/signup")}
                />
              </div>
            </SignedOut>
            <div className="my-5">
              <SignedIn>
                <div className="my-5">
                  <h2 className="text-lg text-white font-primary">Chats</h2>
                  {userChats.slice(0, visibleChats).map((chat) => {
                    const getDocIcon = (chat) => {
                      const ext = getFileExtension(chat.title);
                      return extensions[ext] || "/pdf-icon.svg";
                    };
                    return (
                      <ChatCard
                        key={chat.title}
                        icon={getDocIcon(chat)}
                        title={
                          chat.title.length > 10
                            ? `${chat.title.slice(0, 10)}...`
                            : chat.title
                        }
                        href={chat.id}
                        sourceId={chat.sourceId}
                        type={chat.type}
                      />
                    );
                  })}
                  {visibleChats < userChats.length && (
                    <button
                      onClick={loadMoreChats}
                      className="mt-2 text-blue-500 hover:underline"
                    >
                      Load More Chats
                    </button>
                  )}
                </div>
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
                  href={option.link}
                  onClick={() => handleSidebarItemClick(option.link)}
                />
              ))}
              <SignedIn>
                <SignOutButton>
                  <CustomButton
                    icon={<User size={24} />}
                    text="Sign Out"
                    className="w-full bg-red-500 hover:bg-red-700"
                    onClick={() => handleSidebarItemClick("/logout")}
                  />
                </SignOutButton>
              </SignedIn>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default Sidebar;

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

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

export function ChatCard({ icon, title }) {
  return (
    <div className="p-3 gap-3 flex items-center rounded-xl my-2 cursor-pointer hover:bg-light-bg transition">
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

const chats = [
  {
    title: "General",
    icon: "/pdf-icon.svg",
  },
  {
    title: "General",
    icon: "/word-icon.svg",
  },
  {
    title: "General",
    icon: "/ppt-icon.svg",
  },
];

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

  useEffect(() => {
    if (!user.user) {
      router.push("/login");
    } 
    else {
      console.log("User is logged in");
      console.log(user);
      // console.log(user.user.emailAddresses[0].emailAddress);
    }
  });

  return (
    <>
      {!isMobile ? (
        <aside className="bg-bg text-white w-[350px] h-[100vh] p-4 spacing-y-2 flex flex-col justify-start">
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
          <CustomButton
            icon={<PlusCircleIcon size={24} />}
            text="Create New Chat"
          />
          <SignedIn>
            <div className="my-5">
              <h2 className="text-lg text-white font-primary">Chats</h2>
              {chats.slice(0, 5).map((chat) => (
                <ChatCard
                  key={chat.title}
                  icon={chat.icon}
                  title={chat.title}
                />
              ))}
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
            <MenuIcon size={40} className="text-white m-2" />
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
                {chats.slice(0, 5).map((chat) => (
                  <ChatCard
                    key={chat.title}
                    icon={chat.icon}
                    title={chat.title}
                  />
                ))}
              </SignedIn>
              <SignedOut>
                <p className="text-lg">Log in to view chats</p>
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

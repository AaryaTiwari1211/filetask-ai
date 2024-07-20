"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createChat, uploadDocument } from "@/firebase/utils"; // Add this import
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { mainCards } from "@/assets/static";
import { extensions } from "@/assets/static";
import { RotatingLines } from "react-loader-spinner";
import { apiCall } from "@/functions/api-call";
import { geminiApiCall } from "@/functions/api-call";
import { getChatsByUser } from "@/firebase/utils";
import { checkExistingChat } from "@/firebase/utils";
import { useMediaQuery } from "@/globals/Sidebar";

export const MainCard = ({ title, icon, description }) => {
  return (
    <div className="p-3 gap-3 flex flex-col items-center justify-center rounded-xl my-2 cursor-pointer hover:bg-light-bg transition max-w-[350px] text-center">
      <Image src={icon} width={24} height={24} alt={`${title} icon`} />
      <div className="flex flex-col items-center justify-center">
        <p className="text-[16px] tracking-wide text-white">{title}</p>
        <p className="text-[14px] tracking-wide text-gray-300">{description}</p>
      </div>
    </div>
  );
};

function Loader() {
  return (
    <RotatingLines
      strokeColor="grey"
      strokeWidth="5"
      animationDuration="0.75"
      width="96"
      visible={true}
    />
  );
}

export const Main = () => {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [compressedFileURL, setCompressedFileURL] = useState(null);
  const [icon, setIcon] = useState("/upload.svg");
  const router = useRouter();
  const { user } = useUser();
  const [sourceId, setSourceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sum, setSum] = useState(null);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleFileUpload = async (e) => {
    setLoading(true);
    const file = e.target.files[0];
    setFile(file);
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Large File Detected: Upload may take some time",
        description: "Please be patient while we process your file",
        className: "bg-yellow-500",
      });
      const result = await geminiApiCall(file);
      setSum(result);
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
      className: "bg-green-500",
    });
    setLoading(false);
  };

  const handleChat = async () => {
    try {
      const existingChat = await checkExistingChat(user.id, file.name);
      if (existingChat) {
        router.push(`/chats/${existingChat}/${sourceId}`);
        return;
      }
      const newChatRef = await createChat(user.id, file.name, sum, sourceId); // Pass the summary to createChat
      toast({
        title: "Chat Created",
        description: "Chat created successfully",
        className: "bg-green-500",
      })
      const downloadURL = await uploadDocument(file, newChatRef.id);

      if (file.size > 20 * 1024 * 1024) {
        router.push(`/chats/largeFile/${newChatRef.id}`);
      } else {
        router.push(`/chats/${newChatRef.id}/${sourceId}`);
      }
    } catch (error) {
      console.error("Error uploading file and creating chat:", error);
    }
  };

  const getFileExtension = (filename) => {
    return filename?.split(".").pop().toLowerCase();
  };

  return (
    <div className="w-full h-full flex">
      <div className="lg:m-3 xs:m-0 lg:rounded-lg xs:rounded-none bg-gradient-to-t from-green-900 via-bg to-bg flex flex-col gap-12 justify-center items-center w-full">
        <div className="flex flex-col gap-2 items-center mt-16">
          <h1 className="text-[48px] font-bold text-white tracking-wide">
            Welcome to{" "}
            <span className="bg-gradient-to-l from-bg via-bg to-green-700">
              FileTask
            </span>
          </h1>
          <p className="text-[16px] text-gray-300 tracking-wide">
            The power of AI at your service - Tame the Knowledge
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col bg-transparent items-center justify-center w-96 text-center h-64 border-2 border-gray-600 rounded-2xl cursor-pointer hover:border-green-700 transition"
          >
            <div className="flex flex-col gap-3 items-center justify-center p-5">
              {loading ? (
                <Loader />
              ) : (
                <>
                  <Image src={icon} width={32} height={32} alt="File icon" />
                  {compressedFileURL ? (
                    <>
                      <p className="text-md dark:text-gray-400 text-white">
                        Compressed File
                      </p>
                    </>
                  ) : (
                    <>
                      {file ? (
                        <>
                          <p className="text-md dark:text-gray-400 text-white">
                            {file?.name}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="mb-2 text-md dark:text-gray-400 text-white">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-sm text-white">
                            PDF (.pdf) , PPT (.pptx) , WORD (.docx)
                          </p>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          {file && (
            <div className="flex gap-10 justify-center items-center w-full flex-wrap">
              <Button
                onClick={handleChat}
                className="mt-4 bg-green-500 text-white font-bold hover:bg-green-800 text-lg"
              >
                Chat
              </Button>
              <Button
                className="mt-4 bg-red-500 text-white font-bold hover:bg-green-800 text-lg"
                onClick={() => {
                  setFile(null);
                  setCompressedFileURL(null);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center gap-10 mx-10 flex-wrap justify-center">
          {mainCards.map((card, index) => (
            <MainCard
              key={index}
              title={card.title}
              icon={card.icon}
              description={card.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <>
      <Main />
    </>
  );
}

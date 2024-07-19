"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const mainCards = [
  {
    title: "Clear and Precise",
    icon: "/clear.svg",
    description:
      "Experience crystal-clear communication and concise answers. Upload files effortlessly to get started with our intuitive interface.",
  },
  {
    title: "Personalized Answers",
    icon: "/target.svg",
    description:
      "Get tailored responses that meet your specific needs. View your uploaded files easily and access customized solutions.",
  },
  {
    title: "Saved Chats",
    icon: "/profit.svg",
    description:
      "Keep track of all your interactions and download files seamlessly. Enjoy the convenience of accessing saved chats anytime.",
  },
];

const extensions = {
  pdf: "/pdf-icon.svg",
  pptx: "/ppt-icon.svg",
  docx: "/word-icon.svg",
};

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

export const Main = () => {
  const [file, setFile] = useState(null);
  const [icon, setIcon] = useState("/upload.svg");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFile(file);
    const ext = getFileExtension(file?.name);
    setIcon(extensions[ext] || "/upload.svg");
  };

  const getFileExtension = (filename) => {
    return filename?.split(".").pop().toLowerCase();
  };

  useEffect(() => {
    if (file) {
      console.log(file);
    }
  }, [file]);

  return (
    <div className="w-full h-full flex">
      <div className="m-3 rounded-lg bg-gradient-to-t from-green-900 via-bg to-bg flex flex-col gap-12 justify-center items-center w-full">
        <div className="flex flex-col gap-2 items-center mt-16">
          <h1 className="text-[48px] font-bold text-white tracking-wide">
            Welcome to <span className="bg-gradient-to-l from-bg via-bg to-green-700">FileTask</span>
          </h1>
          <p className="text-[16px] text-gray-300 tracking-wide">
            The power of AI at your service - Tame the Knowledge
          </p>
        </div>
        <div className="flex items-center justify-center">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col bg-transparent items-center justify-center w-96 text-center h-64 border-2 border-gray-600 rounded-2xl"
          >
            <div className="flex flex-col gap-3 items-center justify-center p-5">
              <Image src={icon} width={32} height={32} alt="File icon" />
              {file ? (
                <>
                  <p className="text-md dark:text-gray-400 text-white">
                    {file?.name}
                  </p>
                  <Button
                    className="bg-red-500 text-white"
                    onClick={() => setFile(null)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-2 text-md dark:text-gray-400 text-white">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-sm text-white">
                    PDF (.pdf) , PPT (.pptx) , WORD (.docx)
                  </p>
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
        </div>
        <div className="flex gap-2 items-center gap-10 m-10">
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

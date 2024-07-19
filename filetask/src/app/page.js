"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotatingLines } from "react-loader-spinner";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";
import PptxGenJS from "pptxgenjs";
import pdf from "pdf-parse";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

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
  const MODEL_NAME = "gemini-pro-vision";
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [icon, setIcon] = useState("/upload.svg");
  const [loading, setLoading] = useState(false); // Add loading state
  const [response, setResponse] = useState("");
  const [question, setQuestion] = useState("");
  const [fileContent, setFileContent] = useState("");

  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      setFile(file);
      const ext = getFileExtension(file?.name);
      setIcon(extensions[ext] || "/upload.svg");
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.4,
    topK: 32,
    topP: 1,
    maxOutputTokens: 4096,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const getFileExtension = (filename) => {
    return filename?.split(".").pop().toLowerCase();
  };

  const extractTextFromFile = async (file) => {
    const ext = getFileExtension(file.name);
    let text = "";
    if (ext === "pdf") {
      const data = await pdf(file);
      text = data.text;
    } else if (ext === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else if (ext === "pptx") {
      const pptx = new PptxGenJS();
      await pptx.load(file);
      for (let slide of pptx.slides) {
        for (let shape of slide.shapes) {
          if (shape.text) {
            text += shape.text + " ";
          }
        }
      }
    }
    return text;
  };

  const handleQuestionSubmit = async () => {
    if (!file || !question) {
      toast({
        title: "Error",
        description: "Please upload a file and ask a question.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ type: "text", content: fileContent }] },
        ],
        generationConfig,
        safetySettings,
      });
      console.log(result);
      setResponse(result.response.text());
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing the file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (file) {
      const content = extractTextFromFile(file);
      setFileContent(content);
    }
  }, [file]);

  return (
    <div className="w-full h-full flex">
      <div className="m-3 rounded-lg bg-gradient-to-t from-green-900 via-bg to-bg flex flex-col gap-12 justify-center items-center w-full">
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
        <div className="flex items-center justify-center">
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
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-sm text-white">
                        PDF (.pdf) , PPT (.pptx) , WORD (.docx)
                      </p>
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
        </div>
        <div className="flex flex-col items-center mt-4">
          <input
            type="text"
            placeholder="Ask a question..."
            className="p-2 rounded border border-gray-300"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button
            onClick={handleQuestionSubmit}
            className="mt-4 bg-green-500 text-white font-bold hover:bg-green-800 text-lg"
          >
            Chat
          </Button>
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
        {response && (
          <div className="w-full max-w-3xl p-4 bg-white rounded-lg shadow mt-4">
            <h2 className="text-2xl font-bold">Response</h2>
            <p>{response}</p>
          </div>
        )}
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

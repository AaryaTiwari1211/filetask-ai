import axios from "axios";

export const apiCall = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const responseFile = await axios.post(
      "https://api.chatpdf.com/v1/sources/add-file",
      formData,
      {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_CHATPDF_API_KEY,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("Response file:", responseFile.data);
    return responseFile.data.sourceId;
  } catch (error) {
    console.error("Error fetching sourceId", error);
  }
};

export const geminiApiCall = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const result = await axios.post("https://filetask-ai.onrender.com/upload", formData, {
      timeout: 1200000000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Result:", result.data.summary);
    return result.data.summary;
  } catch (error) {
    console.error("Error:", error);
  }
};

export const SmallPdfChat = async ({ sourceId, newMessage }) => {
  const response = await axios.post(
    "https://api.chatpdf.com/v1/chats/message",
    {
      sourceId: sourceId,
      messages: [
        {
          role: "user",
          content: newMessage,
        },
      ],
    },
    {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_CHATPDF_API_KEY,
      },
    }
  );
  return response;
};

export const largePdfChat = async ({ context, prompt }) => {
  const response = await axios.post("https://filetask-ai.onrender.com/chat", {
    context: context,
    prompt: prompt,
  });

  return response;
};

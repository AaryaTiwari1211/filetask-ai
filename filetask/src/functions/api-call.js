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

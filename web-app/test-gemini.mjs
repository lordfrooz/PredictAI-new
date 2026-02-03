
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyAPQ4GmvmPTDnzZLvoJW1hSPhC70qeheQc" });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Explain how AI works in a few words",
    });
    console.log("SUCCESS:", response.text());
  } catch (error) {
    console.error("ERROR:", error);
  }
}

main();

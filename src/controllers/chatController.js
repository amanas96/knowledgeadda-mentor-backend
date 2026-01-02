import { generateResponse } from "../rag/engine.js";

export const handleChat = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query)
      return res.status(400).json({ success: false, msg: "Query required" });

    // The Controller doesn't care about AI logic, it just asks the engine.
    const response = await generateResponse(query);

    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: "AI Service Error" });
  }
};

import { Message } from "../messages/messages";

export async function getChatResponseStreamLangChain(
  messages: Message[],
  customApiEndpoint: string,
  openAiKey: string, 
  openAiModel: string,
  aiName: string,
  humanName: string
) {

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  const res = await fetch(customApiEndpoint, {
    headers: headers,
    method: "POST",
    body: JSON.stringify({
      messages: messages,
      model: openAiModel,
      max_tokens: 200,
      ai_name: aiName,
      human_name: humanName
    }),
  });

  const reader = res.body?.getReader();
  if (res.status !== 200 || !reader) {
    throw new Error("Something went wrong");
  }

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      const decoder = new TextDecoder("utf-8");
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const data = decoder.decode(value);
          const chunks = data
            .split("data:")
            .filter((val) => !!val && val.trim() !== "[DONE]" && !val.trim().startsWith(": ping"));        
          for (const chunk of chunks) {
            const json = JSON.parse(chunk);
            const messagePiece = json.choices[0].delta.content;
            if (!!messagePiece) {
              controller.enqueue(messagePiece);
            }
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return stream;
}

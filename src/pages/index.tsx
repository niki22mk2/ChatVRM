import { useCallback, useContext, useState, useEffect } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { M_PLUS_2, Montserrat } from "next/font/google";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";

const m_plus_2 = M_PLUS_2({
  variable: "--font-m-plus-2",
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
});

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(
    typeof window !== "undefined" ? localStorage.getItem("systemPrompt") || SYSTEM_PROMPT : SYSTEM_PROMPT
  );
  
  const [openAiKey, setOpenAiKey] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOpenAiKey = localStorage.getItem("openAiKey");
      if (storedOpenAiKey) {
        setOpenAiKey(storedOpenAiKey);
      }
    }
  }, []);

  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("koeiroParam") || "null") || DEFAULT_PARAM : DEFAULT_PARAM
  );
  
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");

  const [openAiModel, setOpenAiModel] = useState(
    typeof window !== "undefined" ? localStorage.getItem("openAiModel") || "gpt-3.5-turbo" : "gpt-3.5-turbo"
  );

  const [loadedVrmFile, setLoadedVrmFile] = useState(
    typeof window !== "undefined" ? localStorage.getItem("loadedVrmFile") || "/AvatarSample_B.vrm" : "/AvatarSample_B.vrm"
  );

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });

      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const handleOpenAiKeyChange = useCallback(
    (key: string) => {
      setOpenAiKey(key);
      if (typeof window !== "undefined") {
        localStorage.setItem("openAiKey", key); //実際は他の保存先を検討する
      }
    }, 
    []
  );
  
  const handleSystemPromptChange = useCallback(
    (systemPrompt: string) => {
      setSystemPrompt(systemPrompt);
      if (typeof window !== "undefined") {
        localStorage.setItem("systemPrompt", systemPrompt);
      }
    }, 
    []
  );
  
  const handleChangeKoeiroParam = useCallback(
    (param: KoeiroParam) => {
      setKoeiroParam(param);
      if (typeof window !== "undefined") {
        localStorage.setItem("koeiroParam", JSON.stringify(param));
      }
    }, 
    []
  );
  
  const handleChangeModel = useCallback(
    (model: string) => {
      setOpenAiModel(model);
      if (typeof window !== "undefined") {
        localStorage.setItem("openAiModel", model);
      }
    }, 
    []
  );

  const handleChangeVrmFile = useCallback(
    (vrmPath: string) => {
      setLoadedVrmFile(vrmPath);
      if (typeof window !== "undefined") {
        localStorage.setItem("loadedVrmFile", vrmPath);
      }
    }, 
    []
  );

  /**
   * 文ごとに音声を直列でリクエストしながら再生する
   */
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      speakCharacter(screenplay, viewer, onStart, onEnd);
    },
    [viewer]
  );

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string) => {
      if (!openAiKey) {
        setAssistantMessage("APIキーが入力されていません");
        return;
      }

      const newMessage = text;

      if (newMessage == null) return;

      setChatProcessing(true);
      // ユーザーの発言を追加して表示
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      // Chat GPTへ
      const messages: Message[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messageLog,
      ];

      const stream = await getChatResponseStream(messages, openAiKey, openAiModel).catch(
        (e) => {
          console.error(e);
          return null;
        }
      );
      if (stream == null) {
        setChatProcessing(false);
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = new Array<string>();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          receivedMessage += value;

          // 返答内容のタグ部分の検出
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          // 返答を一文単位で切り出して処理する
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n]|.{10,}[、,])/
          );
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            // 発話不要/不可能な文字列だった場合はスキップ
            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const aiTalks = textsToScreenplay([aiText], koeiroParam);
            aiTextLog += aiText;

            // 文ごとに音声を生成 & 再生、返答を表示
            const currentAssistantMessage = sentences.join(" ");
            handleSpeakAi(aiTalks[0], () => {
              setAssistantMessage(currentAssistantMessage);
            });
          }
        }
      } catch (e) {
        setChatProcessing(false);
        console.error(e);
      } finally {
        reader.releaseLock();
      }

      // アシスタントの返答をログに追加
      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];

      setChatLog(messageLogAssistant);
      setChatProcessing(false);
    },
    [systemPrompt, chatLog, handleSpeakAi, openAiKey, koeiroParam, openAiModel]
  );

  return (
    <div className={`${m_plus_2.variable} ${montserrat.variable}`}>
      <Meta />
      {!openAiKey && <Introduction openAiKey={openAiKey} onChangeAiKey={handleOpenAiKeyChange} />}
      <VrmViewer VrmPath={loadedVrmFile} />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
      />
      <Menu
        openAiKey={openAiKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        openAiModel={openAiModel}
        onChangeAiKey={handleOpenAiKeyChange}
        onChangeSystemPrompt={handleSystemPromptChange}
        onChangeChatLog={handleChangeChatLog}
        onChangeKoeiromapParam={handleChangeKoeiroParam}
        onChangeModel={handleChangeModel}
        onChangeVrmFile={handleChangeVrmFile}
      />
      <GitHubLink />
    </div>
  );
}

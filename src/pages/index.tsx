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
import { DEFAULT_OPENAI_MODEL, DEFAULT_VRM_MODEL } from "@/features/constants/modelConstants";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { getChatResponseStreamLangChain } from "@/features/chat/langChainChat";
import { M_PLUS_2, Montserrat } from "next/font/google";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { setData, getData } from "@/utils/db";

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
  const isBrowser = typeof window !== "undefined";
  const [isKeyLoaded, setIsKeyLoaded] = useState(false);

  const { viewer } = useContext(ViewerContext);

  const [openAiKey, setOpenAiKey] = useState("");
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");

  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [aiName, setAiName] = useState("AI");
  const [humanName, setHumanName] = useState("Human");
  const [openAiModel, setOpenAiModel] = useState(DEFAULT_OPENAI_MODEL);
  const [loadedVrmFile, setLoadedVrmFile] = useState(DEFAULT_VRM_MODEL);
  const [customApiEndpoint, setCustomApiEndpoint] = useState("");

  const [vrmViewerKey, setVrmViewerKey] = useState(0);
  
  useEffect(() => {
    if (isBrowser) {
      (async () => {
        const storedOpenAiKey = await getData("store", "apiKey");
        if (storedOpenAiKey) setOpenAiKey(storedOpenAiKey);
        setIsKeyLoaded(true);
      })();

      setKoeiroParam(JSON.parse(localStorage.getItem("koeiroParam") || "null") || DEFAULT_PARAM);
      setSystemPrompt(localStorage.getItem("systemPrompt") || SYSTEM_PROMPT);
      setAiName(localStorage.getItem("aiName") || "AI");
      setHumanName(localStorage.getItem("humanName") || "Human");
      setOpenAiModel(localStorage.getItem("openAiModel") || DEFAULT_OPENAI_MODEL);
      setLoadedVrmFile(localStorage.getItem("loadedVrmFile") || DEFAULT_VRM_MODEL);
      setCustomApiEndpoint(localStorage.getItem("customApiEndpoint") || "");
    }
  }, [isBrowser]);  

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });

      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const handleOpenAiKeyChange = useCallback(async (key: string) => {
    setOpenAiKey(key);
    await setData("store", "apiKey", key);
  }, []);

  const handleSystemPromptChange = useCallback((systemPrompt: string) => {
    setSystemPrompt(systemPrompt);
    localStorage.setItem("systemPrompt", systemPrompt);
  }, []);

  const handleAiNameChange = useCallback((aiName: string) => {
    setAiName(aiName);
    localStorage.setItem("aiName", aiName);
  }, []);

  const handleHumanNameChange = useCallback((humanName: string) => {
    setHumanName(humanName);
    localStorage.setItem("humanName", humanName);
  }, []);

  const handleChangeKoeiroParam = useCallback((param: KoeiroParam) => {
    setKoeiroParam(param);
    localStorage.setItem("koeiroParam", JSON.stringify(param));
  }, []);

  const handleChangeModel = useCallback((model: string) => {
    setOpenAiModel(model);
    localStorage.setItem("openAiModel", model);
  }, []);

  const handleChangeVrmFile = useCallback((vrmPath: string) => {
    setLoadedVrmFile(vrmPath);
    localStorage.setItem("loadedVrmFile", vrmPath);
  }, []);

  const handleResetVrmFile = useCallback(() => {
    setLoadedVrmFile(DEFAULT_VRM_MODEL);
    localStorage.setItem("loadedVrmFile", "");
  },[]);

  const handleSetCustomApiEndpoint = useCallback((endpoint: string) => {
    setCustomApiEndpoint(endpoint);
    localStorage.setItem("customApiEndpoint", endpoint);
  }, []);

  const handleRefreshVrmViewer = () => {
    setVrmViewerKey((prevKey) => prevKey + 1);
  };

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
      if (!openAiKey && customApiEndpoint === "") {
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

      const messages: Message[] = [
        {
          role: "system",
          content: customApiEndpoint === "" ? systemPrompt : systemPrompt.replace(/{/g, '{{').replace(/}/g, '}}'),
        },
        ...messageLog,
      ];


      let waitingTimeout;
      const waitingMessage = ["[neutral] えっと", "[relaxed] ちょっと待ってね", "[relaxed] ふむ、ふむ", "[happy] むむむ"];
      waitingTimeout = setTimeout(() => {
        handleSpeakAi(textsToScreenplay([waitingMessage[Math.floor(Math.random() * waitingMessage.length)]], koeiroParam)[0], () => {});
      }, 5000);

      let stream: ReadableStream | null = null;

      if (customApiEndpoint === "") {
        stream = await getChatResponseStream(messages, openAiKey, openAiModel).catch(
          (e) => {
            console.error(e);
            return null;
          }
        );
      } else {
        console.log("customApiEndpoint", customApiEndpoint)
        stream = await getChatResponseStreamLangChain(messages, customApiEndpoint, openAiKey, openAiModel, aiName, humanName).catch(
          (e) => {
            console.error(e);
            return null;
          }
        );
      }
      setChatLog(messageLog);

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
          clearTimeout(waitingTimeout);
          receivedMessage += value;

          // 返答内容のタグ部分の検出
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }
          console.log(receivedMessage)
          // 返答を一文単位で切り出して処理する
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？♪\n]|.{10,}[、,])/
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
        clearTimeout(waitingTimeout);
      }
      
      if (aiTextLog.length > 0) {
        // アシスタントの返答をログに追加
        const messageLogAssistant: Message[] = [
          ...messageLog,
          { role: "assistant", content: aiTextLog },
        ];
        setChatLog(messageLogAssistant);
      } else {
        // 返答がなかった場合はユーザメッセージを削除
        setChatLog(chatLog.slice(0, -1))
      }
      setChatProcessing(false);
    },
    [systemPrompt, chatLog, handleSpeakAi, openAiKey, koeiroParam, openAiModel, customApiEndpoint, aiName, humanName]
  );

  return (
    <div className={`${m_plus_2.variable} ${montserrat.variable}`}>
      <Meta />
      {!openAiKey && isKeyLoaded && (
      <Introduction openAiKey={openAiKey} onChangeAiKey={handleOpenAiKeyChange} />
      )}
      <VrmViewer key={vrmViewerKey} VrmPath={loadedVrmFile} />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
      />
      <Menu
        openAiKey={openAiKey}
        systemPrompt={systemPrompt}
        humanName={humanName}
        aiName={aiName}
        chatLog={chatLog}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        openAiModel={openAiModel}
        loadedVrmFile={loadedVrmFile}
        customApiEndpoint={customApiEndpoint}
        onChangeAiKey={handleOpenAiKeyChange}
        onChangeSystemPrompt={handleSystemPromptChange}
        onChangeHumanName={handleHumanNameChange}
        onChangeAiName={handleAiNameChange}
        onChangeChatLog={handleChangeChatLog}
        onChangeKoeiromapParam={handleChangeKoeiroParam}
        onChangeModel={handleChangeModel}
        onChangeVrmFile={handleChangeVrmFile}
        onResetVrmFile={handleResetVrmFile}
        onSetCustomApiEndpoint={handleSetCustomApiEndpoint}
        onRefreshVrmViewer={handleRefreshVrmViewer}
      />
      <GitHubLink />
    </div>
  );
}

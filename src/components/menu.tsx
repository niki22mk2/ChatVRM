import { IconButton } from "./iconButton";
import { Message } from "@/features/messages/messages";
import { KoeiroParam } from "@/features/constants/koeiroParam";
import { ChatLog } from "./chatLog";
import React, { useCallback, useContext, useRef, useState } from "react";
import { Settings } from "./settings";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { AssistantText } from "./assistantText";
import { setData, deleteData } from "@/utils/db";

type Props = {
  openAiKey: string;
  systemPrompt: string;
  aiName: string;
  humanName: string;
  chatLog: Message[];
  koeiroParam: KoeiroParam;
  assistantMessage: string;
  openAiModel: string;
  loadedVrmFile: string;
  customApiEndpoint: string;
  onChangeSystemPrompt: (systemPrompt: string) => void;
  onChangeHumanName: (humanName: string) => void;
  onChangeAiName: (aiName: string) => void;
  onChangeAiKey: (key: string) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeKoeiromapParam: (param: KoeiroParam) => void;
  onChangeModel: (model: string) => void;
  onChangeVrmFile: (vrmPath: string) => void;
  onResetVrmFile: () => void;
  onSetCustomApiEndpoint: (endpoint: string) => void;
  onRefreshVrmViewer: () => void;
};
export const Menu = ({
  openAiKey,
  systemPrompt,
  aiName,
  humanName,
  chatLog,
  koeiroParam,
  assistantMessage,
  openAiModel,
  loadedVrmFile,
  customApiEndpoint,
  onChangeSystemPrompt,
  onChangeAiName,
  onChangeHumanName,
  onChangeAiKey,
  onChangeChatLog,
  onChangeKoeiromapParam,
  onChangeModel,
  onChangeVrmFile,
  onResetVrmFile,
  onSetCustomApiEndpoint,
  onRefreshVrmViewer
}: Props) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const { viewer } = useContext(ViewerContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangeSystemPrompt = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChangeSystemPrompt(event.target.value);
    },
    [onChangeSystemPrompt]
  );

  const handleChangeAiName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeAiName(event.target.value);
    },
    [onChangeAiName]
  );

  const handleChangeHumanName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeHumanName(event.target.value);
    },
    [onChangeHumanName]
  );

  const handleAiKeyChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeAiKey(event.target.value);
    },
    [onChangeAiKey]
  );

  const handleSetCustomApiEndpoint = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      onSetCustomApiEndpoint(event.target.value);
    },
    [onSetCustomApiEndpoint]
  );

  const handleChangeKoeiroParam = useCallback(
    (x: number, y: number) => {
      onChangeKoeiromapParam({
        speakerX: x,
        speakerY: y,
      });
    },
    [onChangeKoeiromapParam]
  );

  const handleClickOpenVrmFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClickResetVrmFile = useCallback(() => {
    deleteData("store", "vrm");
    onResetVrmFile();
  }, [onResetVrmFile]);

  const handleChangeVrmFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const file = files[0];
      if (!file) return;

      const file_type = file.name.split(".").pop();

      if (file_type === "vrm") {
        const blob = new Blob([file], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        viewer.loadVrm(url);
        
        await setData("store", "vrm", file);
        onChangeVrmFile(file.name);
      }

      event.target.value = "";
    },
    [viewer,onChangeVrmFile]
  );

  const handleModelChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChangeModel(event.target.value);
    },
    [onChangeModel]
  );

  return (
    <>
      <div className="absolute z-10 m-24">
        <div className="grid grid-flow-col gap-[8px]">
          <IconButton
            iconName="24/Menu"
            label="設定"
            isProcessing={false}
            onClick={() => setShowSettings(true)}
          ></IconButton>
          {showChatLog ? (
            <IconButton
              iconName="24/CommentOutline"
              label="会話ログ"
              isProcessing={false}
              onClick={() => setShowChatLog(false)}
            />
          ) : (
            <IconButton
              iconName="24/CommentFill"
              label="会話ログ"
              isProcessing={false}
              disabled={chatLog.length <= 0}
              onClick={() => setShowChatLog(true)}
            />
          )}
        </div>
      </div>
      {showChatLog && <ChatLog messages={chatLog} />}
      {showSettings && (
        <Settings
          openAiKey={openAiKey}
          chatLog={chatLog}
          systemPrompt={systemPrompt}
          aiName={aiName}
          humanName={humanName}
          koeiroParam={koeiroParam}
          openAiModel={openAiModel}
          loadedVrmFile={loadedVrmFile}
          customApiEndpoint={customApiEndpoint}
          onClickClose={() => setShowSettings(false)}
          onChangeAiKey={handleAiKeyChange}
          onChangeSystemPrompt={handleChangeSystemPrompt}
          onChangeAiName={handleChangeAiName}
          onChangeHumanName={handleChangeHumanName}
          onChangeChatLog={onChangeChatLog}
          onChangeKoeiroParam={handleChangeKoeiroParam}
          onClickOpenVrmFile={handleClickOpenVrmFile}
          onClickResetVrmFile={handleClickResetVrmFile}
          onChangeModel={handleModelChange}
          onSetCustomApiEndpoint={handleSetCustomApiEndpoint}
          onRefreshVrmViewer={onRefreshVrmViewer}
        />
      )}
      {!showChatLog && assistantMessage && (
        <AssistantText message={assistantMessage} />
      )}
      <input
        type="file"
        className="hidden"
        accept=".vrm"
        ref={fileInputRef}
        onChange={handleChangeVrmFile}
      />
    </>
  );
};

import React from "react";
import { useState, useCallback } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import {
  KoeiroParam,
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from "@/features/constants/koeiroParam";
import { Link } from "./link";

type Props = {
  openAiKey: string;
  systemPrompt: string;
  aiName: string;
  humanName: string;
  chatLog: Message[];
  koeiroParam: KoeiroParam;
  openAiModel: string;
  loadedVrmFile: string;
  customApiEndpoint: string;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeAiName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeHumanName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeKoeiroParam: (x: number, y: number) => void;
  onClickOpenVrmFile: () => void;
  onClickResetVrmFile: () => void;
  onChangeModel: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onSetCustomApiEndpoint: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRefreshVrmViewer: () => void;
};
export const Settings = ({
  openAiKey,
  chatLog,
  systemPrompt,
  aiName,
  humanName,
  koeiroParam,
  openAiModel,
  loadedVrmFile,
  customApiEndpoint,
  onClickClose,
  onChangeSystemPrompt,
  onChangeAiName,
  onChangeHumanName,
  onChangeAiKey,
  onChangeChatLog,
  onChangeKoeiroParam,
  onClickOpenVrmFile,
  onClickResetVrmFile,
  onChangeModel,
  onSetCustomApiEndpoint,
  onRefreshVrmViewer
}: Props) => {

  const [apiEndpoint, setApiEndpoint] = useState(
    typeof window !== "undefined" && localStorage.getItem("selectedEndpoint") || "openai"
  );
  const handleApiEndpointChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setApiEndpoint(event.target.value);
    typeof window !== "undefined" && localStorage.setItem("selectedEndpoint", event.target.value);
  }, []);

  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur ">
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-24 py-64 ">
          <div className="my-24 typography-32 font-bold">設定</div>
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">API</div>
            <select
              className="bg-surface1 hover:bg-surface1-hover rounded-8 px-16 py-8"
              value={apiEndpoint}
              onChange={handleApiEndpointChange}
            >
              <option value="openai">OpenAI</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {apiEndpoint === "openai" ? (
          <div className="my-24">
            <div className="my-8 typography-10">API キー</div>
            <input
              className="text-ellipsis px-16 py-4 w-col-span-3 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="sk-..."
              value={openAiKey}
              onChange={onChangeAiKey}
            />
            <div>
              APIキーは
              <Link
                url="https://platform.openai.com/account/api-keys"
                label="OpenAIのサイト"
              />
              で取得できます。取得したAPIキーをフォームに入力してください。
            </div>
          </div>
          ) : (
          <div className="my-24">
            <div className="my-8 typography-10">エンドポイントURL</div>
            <input
              className="text-ellipsis px-16 py-4 w-col-span-3 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="http://..."
              value={customApiEndpoint}
              onChange={onSetCustomApiEndpoint}
            />
          </div>
          )}
          <div className="my-16">
            <div className="my-8 typography-10">モデル</div>
            <select
              className="bg-surface1 hover:bg-surface1-hover rounded-8 px-16 py-4"
              value={openAiModel}
              onChange={onChangeModel}
            >
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              <option value="gpt-4">gpt-4</option>
            </select>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              キャラクターモデル
            </div>
            <div>
              現在読み込まれているモデル: {loadedVrmFile}
            </div>
            <div className="my-8">
              <TextButton onClick={onClickOpenVrmFile} className="mr-8">VRMを開く</TextButton>
              <TextButton onClick={onClickResetVrmFile} className="mr-8 bg-subtle hover:bg-subtle-hover">サンプルモデルに戻す</TextButton>
            </div>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              キャラクター設定（システムプロンプト）
            </div>
            {apiEndpoint === "custom" ? (
              <>
                <div className="flex items-center gap-4">
                  <label className="w-[17%]">AI NAME</label>
                  <input
                    className="text-ellipsis px-16 py-8 my-4 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="AI"
                    value={aiName}
                    onChange={onChangeAiName}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-[17%]">HUMAN NAME</label>
                  <input
                    className="text-ellipsis px-16 py-8 my-4 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="Human"
                    value={humanName}
                    onChange={onChangeHumanName}
                  />
                </div>
              </>
            ) : null}
            <textarea
              value={systemPrompt}
              onChange={onChangeSystemPrompt}
              className="px-16 py-8  bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
            ></textarea>

          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">声の調整</div>
            <div>
              Koeiro APIを使用しています。詳しくは
              <a
                className="text-primary hover:text-primary-hover"
                target="_blank"
                rel="noopener noreferrer"
                href="http://koeiromap.rinna.jp"
              >
                http://koeiromap.rinna.jp
              </a>
              をご覧ください。
            </div>
            <div className="mt-16">プリセット</div>
            <div className="my-8 grid grid-cols-2 gap-[8px]">
              <TextButton
                onClick={() =>
                  onChangeKoeiroParam(PRESET_A.speakerX, PRESET_A.speakerY)
                }
              >
                かわいい
              </TextButton>
              <TextButton
                onClick={() =>
                  onChangeKoeiroParam(PRESET_B.speakerX, PRESET_B.speakerY)
                }
              >
                元気
              </TextButton>
              <TextButton
                onClick={() =>
                  onChangeKoeiroParam(PRESET_C.speakerX, PRESET_C.speakerY)
                }
              >
                かっこいい
              </TextButton>
              <TextButton
                onClick={() =>
                  onChangeKoeiroParam(PRESET_D.speakerX, PRESET_D.speakerY)
                }
              >
                渋い
              </TextButton>
            </div>
            <div className="my-24">
              <div className="select-none">x : {koeiroParam.speakerX}</div>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.001}
                value={koeiroParam.speakerX}
                className="mt-8 mb-16 input-range"
                onChange={(e) => {
                  onChangeKoeiroParam(
                    Number(e.target.value),
                    koeiroParam.speakerY
                  );
                }}
              ></input>
              <div className="select-none">y : {koeiroParam.speakerY}</div>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.001}
                value={koeiroParam.speakerY}
                className="mt-8 mb-16 input-range"
                onChange={(e) => {
                  onChangeKoeiroParam(
                    koeiroParam.speakerX,
                    Number(e.target.value)
                  );
                }}
              ></input>
            </div>
          </div>
          {chatLog.length > 0 && (
            <div className="my-40">
              <div className="my-16 typography-20 font-bold">会話履歴</div>
              <div className="my-8">
                {chatLog.map((value, index) => {
                  return (
                    <div
                      key={index}
                      className="my-8 grid grid-flow-col  grid-cols-[min-content_1fr] gap-x-fixed"
                    >
                      <div className="w-[64px] py-8">
                        {value.role === "assistant" ? "Character" : "You"}
                      </div>
                      <input
                        key={index}
                        className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
                        type="text"
                        value={value.content}
                        onChange={(event) => {
                          onChangeChatLog(index, event.target.value);
                        }}
                      ></input>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              非常用
            </div>
            <div className="my-8">
              <TextButton
                onClick={() => {
                  onClickClose();
                  onRefreshVrmViewer();
                }}
                className="mr-8 bg-subtle hover:bg-subtle-hover">
                VRM再読み込み
              </TextButton>
            </div>
          </div>        
        </div>
      </div>
    </div>
  );
};

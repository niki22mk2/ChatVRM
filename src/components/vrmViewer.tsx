import { useContext, useCallback } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { getData } from "@/utils/db";

type VrmViewerProps = {
  VrmPath: string;
};

export default function VrmViewer({ 
  VrmPath 
}: VrmViewerProps) {
  const { viewer } = useContext(ViewerContext);

  const loadVrm = useCallback(async () => {
    const vrmFile = await getData("store", VrmPath);

    if (vrmFile) {
      const url = URL.createObjectURL(vrmFile);
      viewer.loadVrm(url);
    } else {
      viewer.loadVrm(buildUrl(VrmPath));
    }
  }, [VrmPath, viewer]);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        loadVrm();

        // Drag and DropでVRMを差し替え
        canvas.addEventListener("dragover", function (event) {
          event.preventDefault();
        });

        canvas.addEventListener("drop", function (event) {
          event.preventDefault();

          const files = event.dataTransfer?.files;
          if (!files) {
            return;
          }

          const file = files[0];
          if (!file) {
            return;
          }

          const file_type = file.name.split(".").pop();
          if (file_type === "vrm") {
            const blob = new Blob([file], { type: "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            viewer.loadVrm(url);
          }
        });
      }
    },
    [viewer, loadVrm]
  );

  return (
    <div className={"absolute top-0 left-0 w-screen h-[100svh] -z-10"}>
      <canvas ref={canvasRef} className={"h-full w-full"}></canvas>
    </div>
  );
}

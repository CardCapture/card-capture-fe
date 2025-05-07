declare module "react-webcam" {
  import { ComponentType, CSSProperties, RefObject } from "react";
  interface WebcamProps {
    audio?: boolean;
    mirrored?: boolean;
    className?: string;
    style?: CSSProperties;
    screenshotFormat?: string;
    videoConstraints?: MediaTrackConstraints;
    onUserMedia?: () => void;
    onUserMediaError?: (error: Error) => void;
    ref?: RefObject<any>;
  }
  const Webcam: ComponentType<WebcamProps>;
  export default Webcam;
} 
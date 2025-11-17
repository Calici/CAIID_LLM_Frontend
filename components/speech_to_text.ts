import React from "react";

export enum RecordingState {
  RECORDING,
  NOT_RECORDING,
}

type UseRecordP = {
  setRecordedText: (v: string) => void;
  continuous?: boolean;
  interimResult?: boolean;
  timeout?: number;
};

export default function useSpeechToText({
  setRecordedText,
  continuous = true,
  interimResult = true,
  timeout = 5000,
}: UseRecordP) {
  const SpeechRecognition = React.useMemo<
    typeof window.SpeechRecognition | undefined
  >(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition;
  }, []);
  const [isRecording, setIsRecording] = React.useState(
    RecordingState.NOT_RECORDING
  );
  const recognitionRef = React.useRef(
    SpeechRecognition === undefined ? null : new SpeechRecognition()
  );
  const timeoutFuncRef = React.useRef<number>(-1);

  const endRecording = React.useCallback(() => {
    if (recognitionRef.current !== null) recognitionRef.current.stop();
    clearTimeout(timeoutFuncRef.current);
  }, []);
  const makeTimeout = React.useCallback(() => {
    if (timeoutFuncRef.current !== -1) clearTimeout(timeoutFuncRef.current);
    timeoutFuncRef.current = window.setTimeout(endRecording, timeout);
  }, [endRecording, timeout]);
  // const makeTimeout = React.useCallback(() => {
  //   if (!timeout || timeout <= 0) {
  //     return;
  //   }
  //   if (timeoutFuncRef.current !== -1) {
  //     clearTimeout(timeoutFuncRef.current);
  //   }
  //   timeoutFuncRef.current = window.setTimeout(endRecording, timeout);
  // }, [endRecording, timeout]);
  const beginRecording = React.useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (e) => {
        const message = [];
        for (let i = 0; i < e.results.length; i++) {
          message.push(e.results[i][0].transcript);
        }
        setRecordedText(message.join(" "));
        makeTimeout();
      };
      recognitionRef.current.start();
      recognitionRef.current.onerror = (e) => {
        setIsRecording(RecordingState.NOT_RECORDING);
      };
      recognitionRef.current.onend = (e) => {
        setIsRecording(RecordingState.NOT_RECORDING);
      };
      recognitionRef.current.onstart = (e) => {
        setIsRecording(RecordingState.RECORDING);
        makeTimeout();
      };
    }
  }, [makeTimeout, setRecordedText]);
  // const beginRecording = React.useCallback(() => {
  //   if (recognitionRef.current) {
  //     recognitionRef.current.onresult = (e) => {
  //       const result = e.results[e.resultIndex];
  //       const transcript = result[0].transcript;

  //       if (result.isFinal || !interimResult) {
  //         setRecordedText(transcript.trim());
  //       } else {
  //         setRecordedText(transcript.trim());
  //       }
  //     };
  //     recognitionRef.current.start();
  //     recognitionRef.current.onerror = (e) => {
  //       setIsRecording(RecordingState.NOT_RECORDING);
  //     };
  //     recognitionRef.current.onend = (e) => {
  //       setIsRecording(RecordingState.NOT_RECORDING);
  //     };
  //     recognitionRef.current.onstart = (e) => {
  //       setIsRecording(RecordingState.RECORDING);
  //       makeTimeout();
  //     };
  //   }
  // }, [makeTimeout, setRecordedText]);
  const toggleRecording = React.useCallback(() => {
    if (isRecording === RecordingState.RECORDING) endRecording();
    else beginRecording();
  }, [isRecording, endRecording, beginRecording]);
  const shouldKeepRecordingRef = React.useRef(false);

  React.useEffect(() => {
    if (recognitionRef.current !== null) {
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResult;
    }
  }, [continuous, interimResult]);
  return {
    beginRecording,
    endRecording,
    toggleRecording,
    isRecording: isRecording === RecordingState.RECORDING,
  };
}

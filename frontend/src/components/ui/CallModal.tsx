import { useEffect, useMemo, useRef } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Video,
  VideoOff,
} from "lucide-react";
import type { CallStatus, CallType } from "../../hooks/useWebRTCCall";
import { Button } from "./Button";

type Props = {
  open: boolean;
  status: CallStatus;
  type: CallType | null;
  peerName: string;
  peerInitials?: string;
  error?: string | null;

  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  micEnabled: boolean;
  camEnabled: boolean;

  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
};

export function CallModal({
  open,
  status,
  type,
  peerName,
  peerInitials,
  error,
  localStream,
  remoteStream,
  micEnabled,
  camEnabled,
  onAccept,
  onReject,
  onHangup,
  onToggleMic,
  onToggleCam,
}: Props) {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const showVideo = type === "video";

  const title = useMemo(() => {
    if (status === "incoming") return "Incoming call";
    if (status === "outgoing") return "Calling…";
    if (status === "connecting") return "Connecting…";
    if (status === "in-call") return "In call";
    return "Call";
  }, [status]);

  useEffect(() => {
    if (!remoteVideoRef.current) return;
    if (!remoteStream) return;
    remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (!remoteAudioRef.current) return;
    if (!remoteStream) return;
    remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (!localVideoRef.current) return;
    if (!localStream) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

      <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200/20 bg-white dark:bg-slate-900">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {status === "incoming" ? (
                  <PhoneIncoming className="w-4 h-4 text-indigo-600" />
                ) : status === "outgoing" || status === "connecting" ? (
                  <PhoneOutgoing className="w-4 h-4 text-indigo-600" />
                ) : null}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                {type && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {type === "video" ? "Video" : "Audio"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
                {peerName}
              </p>
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={onHangup}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Close"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="relative bg-slate-950">
            {/* Always attach remote audio so audio-only calls work */}
            <audio ref={remoteAudioRef} autoPlay playsInline />
            {showVideo ? (
              <div className="aspect-video w-full bg-slate-950 relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Local preview */}
                <div className="absolute right-4 bottom-4 w-44 aspect-video bg-black/50 rounded-xl overflow-hidden ring-1 ring-white/10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {peerInitials || peerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="mt-4">
                  <div className="text-white font-semibold">{peerName}</div>
                  <div className="text-white/70 text-sm mt-1">
                    {status === "incoming"
                      ? "Audio call"
                      : status === "outgoing" || status === "connecting"
                        ? "Ringing…"
                        : status === "in-call"
                          ? "Connected"
                          : ""}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
            {status === "incoming" ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onReject}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  Decline
                </Button>
                <Button onClick={onAccept}>
                  Accept
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleMic}
                  disabled={!localStream}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                    micEnabled
                      ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300"
                  } disabled:opacity-50`}
                  title={micEnabled ? "Mute" : "Unmute"}
                >
                  {micEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={onToggleCam}
                  disabled={!localStream || !showVideo}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                    camEnabled
                      ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300"
                  } disabled:opacity-50`}
                  title={camEnabled ? "Turn camera off" : "Turn camera on"}
                >
                  {camEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}

            <div className="ml-auto">
              <Button
                onClick={onHangup}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                Hang up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

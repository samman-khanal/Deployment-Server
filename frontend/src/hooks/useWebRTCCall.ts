import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EVENTS, getSocket } from "../services/socket.service";

export type CallType = "audio" | "video";
export type CallStatus =
  | "idle"
  | "incoming"
  | "outgoing"
  | "connecting"
  | "in-call";

type SdpPayload = RTCSessionDescriptionInit;

type IceCandidatePayload = RTCIceCandidateInit;

type CallOfferEvent = {
  dmId: string;
  callId: string;
  type: CallType;
  sdp: SdpPayload;
  fromUserId: string;
};

type CallAnswerEvent = {
  dmId: string;
  callId: string;
  sdp: SdpPayload;
  fromUserId: string;
};

type CallIceEvent = {
  dmId: string;
  callId: string;
  candidate: IceCandidatePayload;
  fromUserId: string;
};

type CallEndEvent = {
  dmId: string;
  callId: string;
  reason?: string;
  fromUserId: string;
};

type CallRejectEvent = {
  dmId: string;
  callId: string;
  reason?: string;
  fromUserId: string;
};

type CallBusyEvent = {
  dmId: string;
  callId: string;
  fromUserId: string;
};

type StartCallArgs = {
  dmId: string;
  peerUserId: string;
  type: CallType;
};

function newCallId(): string {
  try {
    // Modern browsers
    return crypto.randomUUID();
  } catch {
    return `call_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
        "turn:openrelay.metered.ca:80?transport=udp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export function useWebRTCCall() {
  const socket = useMemo(() => getSocket(), []);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingOfferRef = useRef<CallOfferEvent | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CallStatus>("idle");
  const [callId, setCallId] = useState<string | null>(null);
  const [dmId, setDmId] = useState<string | null>(null);
  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  const [type, setType] = useState<CallType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const isActive = status !== "idle";

  // Keep a ref so cleanup doesn't need to re-bind when streams change.
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const cleanup = useCallback(() => {
    pendingOfferRef.current = null;

    try {
      pcRef.current?.close();
    } catch {
      // ignore
    }
    pcRef.current = null;

    const ls = localStreamRef.current;
    localStreamRef.current = null;
    if (ls) {
      ls.getTracks().forEach((t) => t.stop());
    }

    setLocalStream(null);
    setRemoteStream(null);

    setStatus("idle");
    setCallId(null);
    setDmId(null);
    setPeerUserId(null);
    setType(null);
    setError(null);
    setMicEnabled(true);
    setCamEnabled(true);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const ensurePeerConnection = useCallback(
    async ({
      dmId: nextDmId,
      callId: nextCallId,
      peerUserId: nextPeerUserId,
    }: {
      dmId: string;
      callId: string;
      peerUserId: string;
    }) => {
      if (pcRef.current) return pcRef.current;

      const pc = new RTCPeerConnection(RTC_CONFIG);

      pc.onicecandidate = (evt) => {
        if (!evt.candidate) return;
        socket.emit(EVENTS.CALL_ICE_CANDIDATE, {
          dmId: nextDmId,
          callId: nextCallId,
          toUserId: nextPeerUserId,
          candidate: evt.candidate.toJSON(),
        });
      };

      pc.ontrack = (evt) => {
        const streamFromEvent = evt.streams?.[0];
        if (streamFromEvent) {
          setRemoteStream(streamFromEvent);
          return;
        }
        // Fallback: build a stream from individual tracks
        setRemoteStream((prev) => {
          const s = prev ?? new MediaStream();
          s.addTrack(evt.track);
          return s;
        });
      };

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === "failed" || st === "disconnected" || st === "closed") {
          // Let user explicitly hang up; but if the connection dies, clean up.
          if (isActive) {
            setError("Call connection lost");
            cleanup();
          }
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [cleanup, isActive, socket],
  );

  const getMedia = useCallback(async (callType: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    localStreamRef.current = stream;
    setLocalStream(stream);

    // Initialize toggles based on actual tracks
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    setMicEnabled(audioTrack ? audioTrack.enabled : true);
    setCamEnabled(videoTrack ? videoTrack.enabled : true);

    return stream;
  }, []);

  const startCall = useCallback(
    async ({ dmId: nextDmId, peerUserId: nextPeerUserId, type: nextType }: StartCallArgs) => {
      if (isActive) return;

      setError(null);
      setStatus("outgoing");

      const nextCallId = newCallId();
      setCallId(nextCallId);
      setDmId(nextDmId);
      setPeerUserId(nextPeerUserId);
      setType(nextType);

      try {
        const stream = await getMedia(nextType);
        const pc = await ensurePeerConnection({
          dmId: nextDmId,
          callId: nextCallId,
          peerUserId: nextPeerUserId,
        });

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: nextType === "video",
        });
        await pc.setLocalDescription(offer);

        socket.emit(EVENTS.CALL_OFFER, {
          dmId: nextDmId,
          toUserId: nextPeerUserId,
          callId: nextCallId,
          type: nextType,
          sdp: offer,
        });
        setStatus("connecting");
      } catch (e: any) {
        setError(e?.message || "Failed to start call");
        cleanup();
      }
    },
    [cleanup, ensurePeerConnection, getMedia, isActive, socket],
  );

  const acceptCall = useCallback(async () => {
    const offerEvt = pendingOfferRef.current;
    if (!offerEvt) return;

    try {
      setError(null);
      setStatus("connecting");

      const pc = await ensurePeerConnection({
        dmId: offerEvt.dmId,
        callId: offerEvt.callId,
        peerUserId: offerEvt.fromUserId,
      });

      // Get media only after user accepts
      const stream = await getMedia(offerEvt.type);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit(EVENTS.CALL_ANSWER, {
        dmId: offerEvt.dmId,
        toUserId: offerEvt.fromUserId,
        callId: offerEvt.callId,
        sdp: answer,
      });
      setStatus("in-call");
    } catch (e: any) {
      setError(e?.message || "Failed to accept call");
      cleanup();
    }
  }, [cleanup, ensurePeerConnection, getMedia, socket]);

  const rejectCall = useCallback(
    (reason?: string) => {
      const offerEvt = pendingOfferRef.current;
      if (!offerEvt) {
        cleanup();
        return;
      }

      socket.emit(EVENTS.CALL_REJECT, {
        dmId: offerEvt.dmId,
        toUserId: offerEvt.fromUserId,
        callId: offerEvt.callId,
        reason,
      });
      cleanup();
    },
    [cleanup, socket],
  );

  const endCall = useCallback(
    (reason?: string) => {
      if (!dmId || !peerUserId || !callId) {
        cleanup();
        return;
      }

      socket.emit(EVENTS.CALL_END, {
        dmId,
        toUserId: peerUserId,
        callId,
        reason,
      });
      cleanup();
    },
    [callId, cleanup, dmId, peerUserId, socket],
  );

  const toggleMic = useCallback(() => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  }, [localStream]);

  const toggleCam = useCallback(() => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamEnabled(track.enabled);
  }, [localStream]);

  // Socket listeners
  useEffect(() => {
    const onOffer = async (evt: CallOfferEvent) => {
      if (isActive) {
        socket.emit(EVENTS.CALL_BUSY, {
          dmId: evt.dmId,
          toUserId: evt.fromUserId,
          callId: evt.callId,
        });
        return;
      }

      setError(null);
      pendingOfferRef.current = evt;
      setStatus("incoming");
      setCallId(evt.callId);
      setDmId(evt.dmId);
      setPeerUserId(evt.fromUserId);
      setType(evt.type);

      try {
        const pc = await ensurePeerConnection({
          dmId: evt.dmId,
          callId: evt.callId,
          peerUserId: evt.fromUserId,
        });
        await pc.setRemoteDescription(evt.sdp);
      } catch (e: any) {
        setError(e?.message || "Failed to prepare incoming call");
        cleanup();
      }
    };

    const onAnswer = async (evt: CallAnswerEvent) => {
      if (!callId || evt.callId !== callId) return;
      try {
        await pcRef.current?.setRemoteDescription(evt.sdp);
        setStatus("in-call");
      } catch (e: any) {
        setError(e?.message || "Failed to apply answer");
        cleanup();
      }
    };

    const onIce = async (evt: CallIceEvent) => {
      if (!callId || evt.callId !== callId) return;
      try {
        if (evt.candidate) {
          await pcRef.current?.addIceCandidate(evt.candidate);
        }
      } catch {
        // ignore bad candidates
      }
    };

    const onEnd = (evt: CallEndEvent) => {
      if (!callId || evt.callId !== callId) return;
      cleanup();
    };

    const onReject = (evt: CallRejectEvent) => {
      if (!callId || evt.callId !== callId) return;
      setError(evt.reason || "Call rejected");
      cleanup();
    };

    const onBusy = (evt: CallBusyEvent) => {
      if (!callId || evt.callId !== callId) return;
      setError("User is busy");
      cleanup();
    };

    socket.on(EVENTS.CALL_OFFER, onOffer);
    socket.on(EVENTS.CALL_ANSWER, onAnswer);
    socket.on(EVENTS.CALL_ICE_CANDIDATE, onIce);
    socket.on(EVENTS.CALL_END, onEnd);
    socket.on(EVENTS.CALL_REJECT, onReject);
    socket.on(EVENTS.CALL_BUSY, onBusy);

    return () => {
      socket.off(EVENTS.CALL_OFFER, onOffer);
      socket.off(EVENTS.CALL_ANSWER, onAnswer);
      socket.off(EVENTS.CALL_ICE_CANDIDATE, onIce);
      socket.off(EVENTS.CALL_END, onEnd);
      socket.off(EVENTS.CALL_REJECT, onReject);
      socket.off(EVENTS.CALL_BUSY, onBusy);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, cleanup, ensurePeerConnection, isActive, socket]);

  return {
    status,
    callId,
    dmId,
    peerUserId,
    type,
    error,
    localStream,
    remoteStream,
    micEnabled,
    camEnabled,

    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCam,
  };
}

export type WebRTCCallHandle = ReturnType<typeof useWebRTCCall>;

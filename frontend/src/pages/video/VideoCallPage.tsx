import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const VideoCallPage: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Joining room...');

  useEffect(() => {
    const init = async () => {
      try {
        // get camera and mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // connect to signaling server
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {
          setStatus('Connected — waiting for other user...');
          socketRef.current?.emit('join-room', roomId);
        });

        // another user joined — we create the offer
        socketRef.current.on('user-joined', async () => {
          setStatus('Other user joined — connecting...');
          await createPeerConnection();
          const offer = await peerConnectionRef.current!.createOffer();
          await peerConnectionRef.current!.setLocalDescription(offer);
          socketRef.current?.emit('offer', { room: roomId, offer });
        });

        // we received an offer — send answer
        socketRef.current.on('offer', async ({ offer }) => {
          await createPeerConnection();
          await peerConnectionRef.current!.setRemoteDescription(offer);
          const answer = await peerConnectionRef.current!.createAnswer();
          await peerConnectionRef.current!.setLocalDescription(answer);
          socketRef.current?.emit('answer', { room: roomId, answer });
        });

        // we received an answer
        socketRef.current.on('answer', async ({ answer }) => {
          await peerConnectionRef.current!.setRemoteDescription(answer);
        });

        // ICE candidates
        socketRef.current.on('ice-candidate', async ({ candidate }) => {
          try {
            await peerConnectionRef.current!.addIceCandidate(candidate);
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        });

        // other user left
        socketRef.current.on('user-left', () => {
          setStatus('Other user left the call');
          setConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

      } catch (err) {
        setStatus('Could not access camera/mic — check permissions');
        console.error(err);
      }
    };

    init();

    // cleanup on unmount
    return () => {
      endCall();
    };
  }, [roomId]);

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // add local tracks to connection
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // when we get remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnected(true);
        setStatus('Connected!');
      }
    };

    // send ICE candidates to other peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', {
          room: roomId,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(prev => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(prev => !prev);
    }
  };

  const endCall = () => {
    socketRef.current?.emit('leave-room', roomId);
    socketRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    navigate('/meetings');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Status bar */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
        <h1 className="text-white font-medium">Video Call — Room: {roomId}</h1>
        <span className="text-sm text-gray-400">{status}</span>
      </div>

      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center p-6">

        {/* Remote video — main large view */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full max-w-4xl rounded-xl bg-gray-800"
          style={{ minHeight: '400px' }}
        />

        {/* Local video — small overlay */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-10 right-10 w-48 rounded-xl border-2 border-gray-600 bg-gray-800"
        />

        {/* Waiting message */}
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">{status}</p>
              <p className="text-gray-400 text-sm mt-2">Share the room link with the other person</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 py-6 flex items-center justify-center gap-6">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            audioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          {audioEnabled
            ? <Mic size={24} className="text-white" />
            : <MicOff size={24} className="text-white" />
          }
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${
            videoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          {videoEnabled
            ? <Video size={24} className="text-white" />
            : <VideoOff size={24} className="text-white" />
          }
        </button>

        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
        >
          <PhoneOff size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};
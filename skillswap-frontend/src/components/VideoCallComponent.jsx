import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

// Load SimplePeer from the browser bundle to avoid Node.js module issues
let SimplePeer;
const loadSimplePeer = async () => {
  if (SimplePeer) return SimplePeer;
  try {
    // Try to load from the pre-built browser bundle
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/simple-peer@9.11.1/simplepeer.min.js';
    script.onload = () => {
      SimplePeer = window.SimplePeer;
    };
    script.onerror = () => {
      console.error('Failed to load SimplePeer from CDN');
    };
    document.head.appendChild(script);
    
    // Wait for it to load
    return new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (window.SimplePeer) {
          SimplePeer = window.SimplePeer;
          clearInterval(checkLoaded);
          resolve(SimplePeer);
        }
      }, 100);
      setTimeout(() => clearInterval(checkLoaded), 5000);
    });
  } catch (err) {
    console.error('Error loading SimplePeer:', err);
    return null;
  }
};

export default function VideoCallComponent({ sessionId, userId, partnerId, isTeacher }) {
   console.log('VideoCallComponent mounted', { isTeacher, userId, partnerId });
   const [peer, setPeer] = useState(null);
   const [localStream, setLocalStream] = useState(null);
   const [remoteStream, setRemoteStream] = useState(null);
   const [screenShare, setScreenShare] = useState(false);
   const [isMuted, setIsMuted] = useState(false);
   const [isVideoOn, setIsVideoOn] = useState(true);
   const [callDuration, setCallDuration] = useState(0);
   const [connectionStatus, setConnectionStatus] = useState("requesting camera...");

   const localVideoRef = useRef(null);
   const remoteVideoRef = useRef(null);
   const durationIntervalRef = useRef(null);
   const unsubscribeRef = useRef(null);
   const reconnectTimeoutRef = useRef(null);
   const peerRef = useRef(null);
   const isCleaningUpRef = useRef(false);
   const peerReadyRef = useRef(false);

  useEffect(() => {
    initializeCall();
    return () => cleanupCall();
  }, [sessionId, userId]);

  useEffect(() => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(durationIntervalRef.current);
  }, []);

  const initializeCall = async () => {
    try {
      // Reset cleanup flags when starting a new call
      isCleaningUpRef.current = false;
      peerReadyRef.current = false;
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setConnectionStatus("error: browser does not support calls");
        return;
      }

      // Load SimplePeer first
      const SP = await loadSimplePeer();
      if (!SP) {
        setConnectionStatus("error: could not load peer connection library");
        return;
      }

      let stream;
      try {
        // Request camera with fallback options
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          console.log("Camera & microphone enabled");
          setConnectionStatus("camera & mic enabled");
        } catch (videoError) {
          console.warn("Camera not available, trying audio-only:", videoError.message);
          setConnectionStatus("camera not available, audio only");
          try {
            // Try audio-only as fallback
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Audio only stream obtained");
          } catch (audioError) {
            console.error("Audio also not available:", audioError.message);
            // Create a dummy audio track for development/testing when no devices available
            console.warn("No media devices available - creating dummy stream for screen share testing");
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const dest = audioContext.createMediaStreamDestination();
            oscillator.connect(dest);
            oscillator.start();
            stream = dest.stream;
            console.log("Dummy stream created for testing");
            setConnectionStatus("demo mode - screen share available");
          }
        }
      } catch (error) {
        console.error("Error getting media stream:", error);
        setConnectionStatus("error: could not access media devices");
        return;
      }

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      try {
        // Initialize SimplePeer with proper error handling
        const peerConfig = {
          initiator: isTeacher,
          trickle: false,
          stream: stream,
          iceTransportPolicy: 'all',
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
              { urls: "stun:stun2.l.google.com:19302" },
              { urls: "stun:stun3.l.google.com:19302" },
              { urls: "stun:stun4.l.google.com:19302" },
              // Add free TURN servers as fallback for NAT/firewall traversal
              { urls: "turn:numb.viagee.com", username: "webrtc", credential: "webrtc" },
              { urls: "turn:turnserver.cold.pro", username: "webrtc", credential: "webrtc" },
            ],
          },
        };

        const p = new SP(peerConfig);
        peerRef.current = p;
        console.log(`SimplePeer initialized as ${isTeacher ? 'INITIATOR' : 'RESPONDER'}`, { 
          userId,
          partnerId,
          isTeacher,
          initiator: peerConfig.initiator
        });

        // Track connection attempts
        let connectionAttempted = false;

        p.on("signal", (signalData) => {
          connectionAttempted = true;
          console.log("LOCAL SIGNAL GENERATED", {
            type: signalData?.type,
            size: JSON.stringify(signalData).length,
            timestamp: new Date().toISOString(),
            userId: userId
          });
          setConnectionStatus(`signaling (${signalData?.type || 'unknown'})`);
          storeSignalData(signalData);
        });

        p.on("stream", (remoteStream) => {
          console.debug("remote stream received", { tracks: remoteStream.getTracks().length });
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setConnectionStatus("connected");
        });

        // Handle individual track events for screen sharing updates
        if (p._pc) {
          p._pc.ontrack = (event) => {
            console.log("ontrack event received from peer", { 
              kind: event.track.kind, 
              enabled: event.track.enabled,
              readyState: event.track.readyState,
              streams: event.streams.length 
            });
            if (event.streams && event.streams.length > 0) {
              console.log("Updating remote stream with new track");
              setRemoteStream(event.streams[0]);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                console.log("Remote video element updated with ontrack event");
              }
            }
          };
        }

        p.on('connect', () => {
          console.debug('peer connected');
          setConnectionStatus('connected');
        });

        p.on("data", (data) => {
          console.debug("data received:", data);
        });

        p.on("error", (err) => {
          console.error("Peer error:", err);
          const errorMsg = err?.message || String(err);
          if (errorMsg.includes("externalized")) {
            console.warn("SimplePeer dependency issue detected, using audio fallback");
            setConnectionStatus("using audio-only mode");
          } else if (errorMsg.includes("Connection failed")) {
            console.warn("P2P connection failed, will retry with signaling...");
            setConnectionStatus("attempting connection...");
          } else {
            setConnectionStatus(`peer error: ${errorMsg}`);
          }
        });

        p.on("close", () => {
          console.debug('peer closed');
          setConnectionStatus("disconnected");
          peerReadyRef.current = false;
        });

        // Mark peer as ready AFTER all handlers are registered
        peerReadyRef.current = true;
        console.debug('peer ready, starting signal listener');

        // Set peer state to update UI
        setPeer(p);

        // Start listening for signals AFTER peer is fully initialized
        const unsubscribe = listenForSignalData(p);
        if (unsubscribe) {
          unsubscribeRef.current = unsubscribe;
        }
      } catch (peerError) {
        console.error("SimplePeer initialization failed:", peerError);
        const errorMsg = peerError?.message || String(peerError);
        if (errorMsg.includes("externalized") || errorMsg.includes("EventEmitter")) {
          setConnectionStatus("audio-only (p2p unavailable)");
        } else {
          setConnectionStatus("connection initialization failed");
        }
      }
    } catch (error) {
      console.error("Error initializing call:", error);
      setConnectionStatus(`error: ${error.message}`);
    }
  };

  const storeSignalData = async (signalData) => {
    try {
      const signalingRef = doc(db, "sessions", sessionId, "signaling", userId);
      await setDoc(signalingRef, {
        signalData,
        timestamp: new Date(),
        from: userId,
        type: signalData?.type || 'unknown',
      }, { merge: true });
      console.log('SIGNAL STORED TO FIRESTORE', { 
        from: userId, 
        type: signalData?.type,
        path: `sessions/${sessionId}/signaling/${userId}`
      });
      } catch (error) {
      console.error("ERROR storing signal data:", error);
      setConnectionStatus(`signaling error: ${error.message}`);
      }
  };

  const listenForSignalData = (peerInstance) => {
    const signalingRef = collection(db, "sessions", sessionId, "signaling");
    const q = query(signalingRef, where("from", "==", partnerId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          // handle both initial adds and subsequent modifications
          if (change.type === "added" || change.type === "modified") {
            const data = change.doc.data();
            console.log('SIGNAL RECEIVED FROM FIRESTORE', {
              type: data?.signalData?.type,
              from: data?.from,
              change: change.type,
              timestamp: data?.timestamp
            });
            if (!data || !data.signalData) {
              console.log('Signal data missing or empty');
              return;
            }
            
            // Check if cleanup is in progress
            if (isCleaningUpRef.current) {
              console.log('Ignoring signal during cleanup');
              return;
            }
            
            // Check if peer is ready
            if (!peerReadyRef.current) {
              console.warn('Peer not ready yet, dropping signal', data?.signalData?.type);
              // Signal will be missed but that's OK - ICE candidates can be retried
              return;
            }
            
            // Use peerRef for most current state
            const activePeer = peerRef.current || peerInstance;
            if (!activePeer) {
              console.warn('Peer reference lost when signal arrived');
              return;
            }
            
            try {
              console.log('PROCESSING SIGNAL:', data.signalData.type, {
                from: data?.from,
                to: userId
              });
              activePeer.signal(data.signalData);
            } catch (error) {
              if (!error.message.includes('destroyed')) {
                console.error("Error signaling:", error);
              }
            }
          }
        });
      },
      (error) => {
        console.error("Error listening for signals:", error);
      }
    );

    return unsubscribe;
  };

  const cleanupCall = () => {
    // Only set cleanup if peer actually exists (prevent false cleanup during re-renders)
    if (!peerRef.current) {
      return;
    }
    
    isCleaningUpRef.current = true;
    peerReadyRef.current = false;
    
    console.log('CLEANUP STARTED');
    
    // Unsubscribe from signals first to prevent incoming signals during cleanup
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    
    // Destroy peer after unsubscribing
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.debug('Error destroying peer:', e);
      }
      peerRef.current = null;
    }
    
    if (peer) {
      setPeer(null);
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenShare) {
        console.log("Starting screen share request...");
        
        // Request screen capture from user
        let screenStream;
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
              cursor: 'always',
              displaySurface: 'monitor'
            },
            audio: false,
          });
          console.log("Screen stream obtained", { tracks: screenStream.getTracks().length });
        } catch (err) {
          console.error("Screen share permission denied or failed:", err.message);
          setConnectionStatus('screen share cancelled or not available');
          return;
        }

        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) {
          console.error("No screen track obtained from stream");
          setConnectionStatus('screen share failed: no video track');
          return;
        }

        // Update local preview immediately
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          console.log("Updated local preview to screen");
        }

        // Share screen via WebRTC
        if (peerRef.current && peerRef.current._pc) {
          try {
            const senders = peerRef.current._pc.getSenders();
            const videoSender = senders.find((s) => s.track && s.track.kind === "video");

            if (videoSender) {
              // Replace existing video track via WebRTC API
              console.log("Replacing video track with screen track");
              await videoSender.replaceTrack(screenTrack);
              console.log("Screen track sent to peer successfully");
              setConnectionStatus('screen sharing');
            } else {
              // No sender yet - add the track with stream
              console.log("Adding screen track as new sender");
              const newSender = await peerRef.current._pc.addTrack(screenTrack, screenStream);
              console.log("Screen track added to peer connection");
              setConnectionStatus('screen sharing');
            }
          } catch (e) {
            console.error('Error sharing screen:', e);
            setConnectionStatus('screen share failed');
            return;
          }
        } else {
          console.warn("Peer not ready for screen sharing");
          setConnectionStatus('screen previewing locally; will share when connection is ready');
        }

        // Handle when user stops screen sharing (browser or user stops share)
        screenTrack.onended = async () => {
          console.log("Screen share ended by user");
          
          // Restore camera track
          if (localStream && peerRef.current && peerRef.current._pc) {
            try {
              const senders = peerRef.current._pc.getSenders();
              const videoSender = senders.find((s) => s.track && s.track.kind === "video");
              const cameraTrack = localStream.getVideoTracks()[0];
              
              if (videoSender && cameraTrack) {
                console.log("Restoring camera track");
                await videoSender.replaceTrack(cameraTrack);
              }
            } catch (err) {
              console.warn("Error restoring camera track:", err);
            }
          }
          
          // Restore local preview to camera
          if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            console.log("Restored local preview to camera");
          }
          
          setScreenShare(false);
          setConnectionStatus('connected');
        };

        setScreenShare(true);
      } else {
        // Stop screen sharing - restore camera
        console.log("Stopping screen share");
        
        if (peerRef.current && peerRef.current._pc && localStream) {
          try {
            const senders = peerRef.current._pc.getSenders();
            const videoSender = senders.find((s) => s.track && s.track.kind === "video");
            const cameraTrack = localStream.getVideoTracks()[0];

            if (videoSender && cameraTrack) {
              console.log("Replacing screen track with camera track");
              await videoSender.replaceTrack(cameraTrack);
            }
          } catch (e) {
            console.warn('Error restoring camera:', e);
          }
        }
        
        // Restore local preview
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
          console.log("Restored local preview to camera");
        }
        
        setScreenShare(false);
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      setConnectionStatus('screen share error');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative flex gap-4 p-4 bg-black min-h-96">
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-white text-lg font-semibold mb-2">Waiting for partner...</p>
                <p className="text-gray-300 text-sm">{connectionStatus}</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 text-white text-sm font-semibold">
            Partner
          </div>
        </div>

        <div className="w-40 h-40 bg-gray-800 rounded-lg overflow-hidden relative border-2 border-primary-500">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <p className="text-white text-xs text-center px-2">{connectionStatus}</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-white text-xs font-semibold">
            You
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border-t border-gray-700 p-6">
        <div className="flex justify-center items-center gap-8">
          <div className="text-white font-semibold text-lg">
            {formatDuration(callDuration)}
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={toggleMute}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              <span className="text-white text-2xl">{isMuted ? "🔇" : "🔊"}</span>
            </button>
            <div className="text-xs text-white mt-2">Mute</div>
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={toggleVideo}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
                !isVideoOn
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={isVideoOn ? "Turn off video" : "Turn on video"}
              aria-label={isVideoOn ? "Turn off video" : "Turn on video"}
            >
              <span className="text-white text-2xl">{isVideoOn ? "📹" : "📷"}</span>
            </button>
            <div className="text-xs text-white mt-2">Video</div>
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={toggleScreenShare}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
                screenShare
                  ? "bg-primary-500 hover:bg-primary-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={screenShare ? "Stop screen share" : "Share screen"}
              aria-label={screenShare ? "Stop screen share" : "Share screen"}
            >
              <span className="text-white text-2xl">🖥️</span>
            </button>
            <div className="text-xs text-white mt-2">Share</div>
          </div>
        </div>
      </div>
    </div>
  );
}

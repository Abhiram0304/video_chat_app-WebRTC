import { useEffect, useState, useRef } from 'react'

const Receiver = () => {

    const [_, setSocket] = useState<WebSocket | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = new WebSocket('wss://video-chat-app-webrtc-gepv.onrender.com');
        // const socket = new WebSocket('ws://localhost:8080');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({ type : 'this-is-receiver'}));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            const pc = pcRef.current;
        
            if(message.type === 'create-offer'){
                const pc = new RTCPeerConnection();
                pcRef.current = pc;

                pc.onicecandidate = (event) => {
                    if(event.candidate){
                        socket.send(JSON.stringify({ type: "add-ice-candidate", candidate: event.candidate }));
                    }
                }

                pc.ontrack = (event) => {
                    if(remoteVideoRef.current){
                        const remoteStream = remoteVideoRef.current.srcObject as MediaStream || new MediaStream();
                        remoteStream.addTrack(event.track);
                        remoteVideoRef.current.srcObject = remoteStream;
                        remoteVideoRef.current.play();
                    }
                }

                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                pc.addTrack(stream.getVideoTracks()[0]);
                pc.addTrack(stream.getAudioTracks()[0]);

                if(videoRef.current){
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }

                await pc.setRemoteDescription(message.sdp);
                const answer = await pc.createAnswer();
                pc.setLocalDescription(answer);
                if(socket){
                    socket.send(JSON.stringify({ type : "create-answer", sdp : answer}));
                }
            }else if(message.type === "add-ice-candidate"){
                pc?.addIceCandidate(message.candidate);
            }
        }
    }, []);

  return (
    <div>
        Receiver
        <video ref={videoRef} autoPlay playsInline ></video>
        <video ref={remoteVideoRef} autoPlay playsInline></video>
    </div>
  )
}

export default Receiver
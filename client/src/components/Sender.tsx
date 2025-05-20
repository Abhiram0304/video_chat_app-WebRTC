import { useEffect, useRef, useState } from 'react'

const Sender = () => {

    const [socket, setSocket] = useState<WebSocket | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = new WebSocket('wss://video-chat-app-webrtc-gepv.onrender.com');
        // const socket = new WebSocket('ws://localhost:8080');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({ type : 'this-is-sender'}));
        };

        socket.onmessage = async(event) => {
            const message = JSON.parse(event.data);
            const pc = pcRef.current;
            if(!pc) return;
            if(message.type === 'create-answer'){
                await pc.setRemoteDescription(message.sdp);
            }else if(message.type === 'add-ice-candidate'){
                await pc.addIceCandidate(message.candidate);
            }
        }
        
    }, []);

    const startSendingVideo = async() => {
        if(!socket) return;
        const pc = new RTCPeerConnection();
        pcRef.current = pc;
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        pc.addTrack(stream.getVideoTracks()[0]);

        if(videoRef.current){
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }

        pc.ontrack = (event) => {
            if(remoteVideoRef.current){
                const remoteStream = remoteVideoRef.current.srcObject as MediaStream || new MediaStream();
                remoteStream.addTrack(event.track);
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play();
            }
        }

        pc.onicecandidate = (event) => {
            if(event.candidate){
                socket.send(JSON.stringify({ type: "add-ice-candidate", candidate: event.candidate }));
            }
        }

        pc.onnegotiationneeded = async() => {
            console.log("NEGOTTION NEEDED");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: "create-offer", sdp: offer }));
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if(message.type === 'create-answer'){
                pc.setRemoteDescription(message.sdp);
            }else if(message.type === 'add-ice-candidate'){
                pc.addIceCandidate(message.candidate);
            }
        }

        
    }

  return (
    <div>
        Sender
        <button onClick={startSendingVideo}>
            Send Video
        </button>
        <video ref={videoRef} autoPlay playsInline muted></video>
        <video ref={remoteVideoRef} autoPlay playsInline></video>
    </div>
  )
}

export default Sender
import { useEffect, useRef, useState } from 'react'

const Sender = () => {

    const [socket, setSocket] = useState<WebSocket | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({ type : 'this-is-sender'}));
        };
    }, []);

    const startSendingVideo = async() => {
        if(!socket) return;
        const pc = new RTCPeerConnection();

        pc.onnegotiationneeded = async() => {
            console.log("NEGOTTION NEEDED");
            const offer = await pc.createOffer(); // THIS IS THE SDP
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: "create-offer", sdp: offer }));
        }

        
        pc.onicecandidate = (event) => {
            if(event.candidate){
                socket.send(JSON.stringify({ type: "add-ice-candidate", candidate: event.candidate }));
            }
        }   

        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if(message.type === 'create-answer'){
                pc.setRemoteDescription(message.sdp);
            }else if(message.type === 'add-ice-candidate'){
                pc.addIceCandidate(message.candidate);
            }
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        pc.addTrack(stream.getVideoTracks()[0]);
        // pc.addTrack(stream.getAudioTracks()[0]);

        if(videoRef.current){
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
    }

  return (
    <div>
        Sender
        <button onClick={startSendingVideo}>
            Send Video
        </button>
        <video ref={videoRef} autoPlay playsInline muted></video>
    </div>
  )
}

export default Sender
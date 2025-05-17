import { useEffect, useState, useRef } from 'react'

const Receiver = () => {

    const [socket, setSocket] = useState<WebSocket | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({ type : 'this-is-receiver'}));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            const pc = new RTCPeerConnection();
            setPc(pc);
            if(message.type === 'create-offer'){
                pc.setRemoteDescription(message.sdp);
                pc.onicecandidate = (event) => {
                    if(event.candidate){
                        socket.send(JSON.stringify({ type: "add-ice-candidate", candidate: event.candidate }));
                    }
                }

                pc.ontrack = (event) => {
                    console.log("TRACK", event);
                    if(videoRef.current){
                        console.log("HERE", event.track);
                        videoRef.current.srcObject = new MediaStream([event.track]);
                        videoRef.current.play();
                    }
                }

                const answer = await pc.createAnswer();
                pc.setLocalDescription(answer);
                if(socket){
                    socket.send(JSON.stringify({ type : "create-answer", sdp : answer}));
                }
            }else if(message.type === "add-ice-candidate"){
                pc.addIceCandidate(message.candidate);
            }
        }
    }, []);

  return (
    <div>
        Receiver
        <video ref={videoRef} autoPlay playsInline muted ></video>
    </div>
  )
}

export default Receiver
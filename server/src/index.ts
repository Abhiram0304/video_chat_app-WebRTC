import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket : null | WebSocket = null;
let receiverSocket : null | WebSocket = null;

wss.on('connection', function connection(ws) {
    ws.on('message', function message(data : any){
        const message = JSON.parse(data);
        if(message.type === "this-is-sender"){
            senderSocket = ws;
            console.log("SET SENDER SOCKET");
        }else if(message.type === "this-is-receiver"){
            receiverSocket = ws;
            console.log("SET RECEIVER SOCKET");
        }else if(message.type === "create-offer"){
            if(!receiverSocket) return;
            receiverSocket.send(JSON.stringify({type: "create-offer", sdp: message.sdp}));
            console.log("first offer sent");
        }else if(message.type === "create-answer"){
            if(!senderSocket) return;
            senderSocket.send(JSON.stringify({type: "create-answer", sdp: message.sdp}));
            console.log("first answer sent");
        }else if(message.type === "add-ice-candidate"){
            if((ws == senderSocket) && receiverSocket){
                receiverSocket.send(JSON.stringify({type: "add-ice-candidate", candidate: message.candidate})); 
                console.log("first ice candidate sent to rcv");
            }else if((ws == receiverSocket) && senderSocket){
                senderSocket.send(JSON.stringify({type: "add-ice-candidate", candidate: message.candidate}));
                console.log("first ice candidate sent to snd");
            }
        }
    })
})

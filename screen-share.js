// Getting elements from the DOM
const shareScreenBtn = document.getElementById('shareScreenBtn');
const remoteVideo = document.getElementById('remoteVideo');

// WebRTC peer connection configuration
const peerConnectionConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'  // Google's STUN server
    }
  ]
};

let localStream;
let peerConnection;
let remoteStream;

// Step 1: Capture the screen
shareScreenBtn.addEventListener('click', () => {
    navigator.mediaDevices.getDisplayMedia({ video: true })
    .then(stream => {
        localStream = stream;

        // Start WebRTC connection after screen is captured
        startConnection(stream);
    }).catch(err => {
        console.error('Error capturing screen:', err);
    });
});

// Step 2: Create the peer connection and send the stream
function startConnection(stream) {
    // Create the peer connection
    peerConnection = new RTCPeerConnection(peerConnectionConfig);

    // Add the captured screen to the peer connection
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    // Set up ICE candidate handler
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    // Set up remote stream handler
    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream; // Display remote stream
        remoteVideo.play();
    };

    // Step 3: Create an offer and send it to the other peer
    peerConnection.createOffer().then(offer => {
        return peerConnection.setLocalDescription(offer);
    }).then(() => {
        socket.emit('offer', peerConnection.localDescription);
    }).catch(err => {
        console.error('Error creating offer:', err);
    });
}

// Step 3: Handle incoming offer and answer
socket.on('offer', (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => {
        return peerConnection.createAnswer();
    }).then(answer => {
        return peerConnection.setLocalDescription(answer);
    }).then(() => {
        socket.emit('answer', peerConnection.localDescription);
    }).catch(err => {
        console.error('Error handling offer:', err);
    });
});

// Step 4: Handle incoming answer
socket.on('answer', (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Step 5: Handle ICE candidates
socket.on('candidate', (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

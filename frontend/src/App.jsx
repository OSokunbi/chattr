import { useState, useEffect, useRef} from 'react';
import "./App.css"

const App = () => {
  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [userColorMap, setUserColorMap] = useState({});
  const [chatLog, setChatLog] = useState([]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const generateRandomColor = () => {
      const presetColors = [
        'rgb(255, 0, 0)',   // red
        'rgb(0, 255, 0)',   // green
        'rgb(0, 0, 255)',   // blue
        'rgb(255, 255, 0)', // yellow
        'rgb(255, 0, 255)', // magenta
        'rgb(0, 255, 255)', // cyan
        'rgb(128, 0, 128)', // purple
        'rgb(255, 165, 0)', // orange
        'rgb(0, 128, 0)',   // dark green
        'rgb(128, 128, 0)'  // olive
      ];

      const randomIndex = Math.floor(Math.random() * presetColors.length);
      return presetColors[randomIndex];
    };

    const generateUsername = () => {
      const adjectives = ['Happy', 'Silly', 'Clever', 'Cheerful', 'Brave', 'Lucky', 'Funny', 'Gentle', 'Kind', 'Smart'];
      const animals = ['Cat', 'Dog', 'Elephant', 'Tiger', 'Monkey', 'Bear', 'Lion', 'Penguin', 'Dolphin', 'Fox'];
      const randomNumber = Math.floor(Math.random() * 10000);
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      return `${randomAdjective}${randomAnimal}${randomNumber}`;
    };

    const loadUserColorMapFromLocalStorage = () => {
      const storedColorMap = localStorage.getItem('userColorMap');
      if (storedColorMap) {
        setUserColorMap(JSON.parse(storedColorMap));
      }
    };

    const saveUserColorMapToLocalStorage = (colorMap) => {
      localStorage.setItem('userColorMap', JSON.stringify(colorMap));
    };

    loadUserColorMapFromLocalStorage();

    const username = generateUsername();
    setUsername(username);

    const socket = new WebSocket('wss://localhost:80/ws');

    socket.onopen = () => {
      console.log('WebSocket connected');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data);
      setChatLog(prevChatLog => {
        if (!prevChatLog.some(msg => msg.id === incomingMessage.id)) {
          return [...prevChatLog, incomingMessage];
        }
        return prevChatLog;
      });
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    setUserColorMap(prevMap => {
      const colorMap = { ...prevMap, [username]: generateRandomColor() };
      saveUserColorMapToLocalStorage(colorMap);
      return colorMap;
    });

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  },[chatLog])

  const sendMessage = () => {
    if (!ws) {
      console.error('WebSocket connection not established');
      return;
    }
    if(message.trim() === ''){
      return;
    }

    const messageToSend = {
      username: username,
      message: message,
    };

    ws.send(JSON.stringify(messageToSend));
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }

  return (
    <div className="App">
    <div className="body">
      <div className="container">
        <div ref={chatContainerRef} className="chat-container">
          {chatLog.map((msg, index) => (
            <div key={msg.id} className="message-container">
              <div className={`message ${msg.username === username ? "sent" : "received"}`}>
                <span style={{ fontWeight: "bold", color: userColorMap[msg.username] || 'black' }}>{`${msg.username === username ? "You" : msg.username}`}</span>
                {msg.message}
              </div>
            </div>
          ))}
        </div>
        <div className="input-container">
          <input
            className="input"
            name="message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message"
            onKeyDown={handleKeyPress}
          />
          <button
            className="button"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
      </div>
      </div>
    );
  };

export default App;

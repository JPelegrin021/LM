const chatOutput = document.getElementById('chat-output');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// URL del servidor local de LM Studio (reemplaza el puerto con el correcto)
const baseUrl = 'http://79.154.248.239:1234/v1';

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

let chatHistory = [
    { role: 'system', content: 'You are a helpful assistant for all the user needs, from coding, to cooking chef, workout assistant, homework etc.' }
];

async function sendMessage() {
    const userMessage = userInput.value;
    appendMessage('Usuario', userMessage);
    userInput.value = '';

    chatHistory.push({ role: 'user', content: userMessage });

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: chatHistory,
                temperature: 0.7,
                max_tokens: -1,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let assistantMessage = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunkString = decoder.decode(value);
            const chunkLines = chunkString.split('\n');

            for (const line of chunkLines) {
                if (line.startsWith('data:')) {
                    const data = line.substring(5).trim();
                    if (data !== '[DONE]') {
                        const jsonData = JSON.parse(data);
                        const content = jsonData.choices[0].delta.content;
                        if (content) {
                            assistantMessage += content;
                            appendMessage('Asistente', assistantMessage);
                        }
                    } else {
                        console.log('Respuesta completa recibida');
                    }
                }
            }
        }

        chatHistory.push({ role: 'assistant', content: assistantMessage });
    } catch (error) {
        console.error('Error:', error.message);
        appendMessage('Error', 'Hubo un problema al comunicarse con el servidor local de LM Studio.');
    }
}
let lastMessageElement = null;

function appendMessage(sender, message) {
    if (sender === 'Asistente') {
        if (lastMessageElement) {
            lastMessageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        } else {
            lastMessageElement = document.createElement('div');
            lastMessageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
            chatOutput.appendChild(lastMessageElement);
        }
    } else {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatOutput.appendChild(messageElement);
        lastMessageElement = null;
    }
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

// Función para obtener la lista de modelos cargados en el servidor local de LM Studio
async function getLoadedModels() {
    try {
        const response = await axios.get(`${baseUrl}/models`);
        const models = response.data.data;
        console.log('Modelos cargados en el servidor local de LM Studio:');
        models.forEach(model => {
            console.log(`- ${model.id}`);
        });
    } catch (error) {
        console.error('Error al obtener los modelos cargados:', error.message);
    }
}

// Llamar a la función para obtener la lista de modelos cargados al cargar la página
getLoadedModels();
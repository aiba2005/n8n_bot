// async function send(){
//
//
//     let input=document.getElementById("msg");
//
//     let text=input.value.trim();
//
//
//     if(!text)
//         return;
//
//
//     const chat=document.getElementById("chat");
//
//
//
//     // сообщение пользователя
//
//     chat.innerHTML += `
//
//     <div class="message user">
//
//         <div class="bubble">
//             ${text}
//         </div>
//
//     </div>
//
//     `;
//
//
//     input.value="";
//
//
//     chat.scrollTop=chat.scrollHeight;
//
//
//
//     // индикатор
//
//     let loading=document.createElement("div");
//
//     loading.className="message bot";
//
//     loading.innerHTML=`
//
//         <div class="avatar">🤖</div>
//
//         <div class="bubble">
//             Печатаю...
//         </div>
//
//     `;
//
//
//     chat.appendChild(loading);
//
//
//
//     try{
//
//
//         let r=await fetch(
//             "http://127.0.0.1:8000/chat",
//             {
//
//             method:"POST",
//
//             headers:{
//                 "Content-Type":"application/json"
//             },
//
//
//             body:JSON.stringify({
//
//                 message:text
//
//             })
//
//         });
//
//
//
//         let data=await r.json();
//
//
//
//         loading.remove();
//
//
//
//         let answer=data.text || data.answer || "Нет ответа";
//
//
//
//         // отделяем источник
//
//         let source="";
//
//
//         let match=answer.match(
//             /Источник:\s*(.*)/
//         );
//
//
//         if(match){
//
//             source=`
//
//             <div class="source">
//             📌 Источник:
//             <a href="${match[1]}" target="_blank">
//             ${match[1]}
//             </a>
//             </div>
//
//             `;
//
//
//             answer=
//             answer.replace(
//                 /Источник:\s*.*/,
//                 ""
//             );
//
//         }
//
//
//
//         chat.innerHTML += `
//
//         <div class="message bot">
//
//             <div class="avatar">
//             🤖
//             </div>
//
//
//             <div class="bubble">
//
//                 ${answer}
//
//                 ${source}
//
//             </div>
//
//         </div>
//
//
//         `;
//
//
//
//     }
//
//     catch(error){
//
//
//         loading.remove();
//
//
//         chat.innerHTML += `
//
//         <div class="message bot">
//
//         <div class="avatar">
//         🤖
//         </div>
//
//
//         <div class="bubble">
//         Ошибка подключения к серверу
//         </div>
//
//
//         </div>
//
//         `;
//
//     }
//
//
//
//     chat.scrollTop=chat.scrollHeight;
//
// }


const API_URL = "http://127.0.0.1:8000/chat";

const chat = document.getElementById("chat");
const chatForm = document.getElementById("chatForm");
const input = document.getElementById("msg");
const sendButton = document.getElementById("sendButton");
const clearChatButton = document.getElementById("clearChatButton");
const suggestions = document.getElementById("suggestions");

let isSending = false;

function getCurrentTime() {
    return new Intl.DateTimeFormat("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date());
}

function scrollToBottom() {
    chat.scrollTop = chat.scrollHeight;
}

function autoResizeInput() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
}

function createMessageElement({
    role,
    text = "",
    sourceUrl = "",
    isError = false,
    isTyping = false,
}) {
    const message = document.createElement("div");
    message.className = [
        "message",
        role === "user" ? "user-message" : "bot-message",
        isError ? "error-message" : "",
    ]
        .filter(Boolean)
        .join(" ");

    if (role === "bot") {
        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = "AI";
        message.appendChild(avatar);
    }

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    if (isTyping) {
        const typing = document.createElement("div");
        typing.className = "typing";
        typing.setAttribute("aria-label", "Бот печатает");

        for (let index = 0; index < 3; index += 1) {
            typing.appendChild(document.createElement("span"));
        }

        bubble.appendChild(typing);
    } else {
        const answerText = document.createElement("div");
        answerText.textContent = text;
        bubble.appendChild(answerText);

        if (sourceUrl) {
            const sourceCard = document.createElement("div");
            sourceCard.className = "source-card";

            const label = document.createElement("div");
            label.className = "source-label";
            label.textContent = "Источник";

            const link = document.createElement("a");
            link.href = sourceUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = sourceUrl;

            sourceCard.append(label, link);
            bubble.appendChild(sourceCard);
        }
    }

    const time = document.createElement("time");
    time.className = "message-time";
    time.textContent = getCurrentTime();

    content.append(bubble, time);
    message.appendChild(content);

    return message;
}

function addMessage(options) {
    const message = createMessageElement(options);
    chat.appendChild(message);
    scrollToBottom();
    return message;
}

function removeSuggestions() {
    if (suggestions) {
        suggestions.remove();
    }
}

function setSendingState(state) {
    isSending = state;
    input.disabled = state;
    sendButton.disabled = state;

    if (!state) {
        input.focus();
    }
}

function normalizeSourceUrl(rawValue) {
    if (!rawValue) {
        return "";
    }

    const value = rawValue.trim();

    try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

function parseAnswer(rawAnswer) {
    const answer = String(rawAnswer ?? "").trim();

    const sourcePattern =
        /(?:Источник|Булак|Source)\s*:\s*(https?:\/\/[^\s]+)/i;

    const match = answer.match(sourcePattern);

    if (!match) {
        return {
            text: answer || "Сервер вернул пустой ответ.",
            sourceUrl: "",
        };
    }

    return {
        text:
            answer.replace(match[0], "").trim() ||
            "Ответ получен. Подробности доступны в источнике.",
        sourceUrl: normalizeSourceUrl(match[1]),
    };
}

async function requestAnswer(message) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message,
        }),
    });

    if (!response.ok) {
        let details = "";

        try {
            const errorData = await response.json();
            details =
                errorData.detail ||
                errorData.message ||
                errorData.error ||
                "";
        } catch {
            details = "";
        }

        throw new Error(
            details || `Сервер вернул ошибку ${response.status}.`,
        );
    }

    const data = await response.json();

    return (
        data.text ||
        data.answer ||
        data.message ||
        data.response ||
        ""
    );
}

async function sendMessage(rawText) {
    const text = rawText.trim();

    if (!text || isSending) {
        return;
    }

    removeSuggestions();
    addMessage({
        role: "user",
        text,
    });

    input.value = "";
    autoResizeInput();
    setSendingState(true);

    const typingMessage = addMessage({
        role: "bot",
        isTyping: true,
    });

    try {
        const rawAnswer = await requestAnswer(text);
        const { text: answerText, sourceUrl } = parseAnswer(rawAnswer);

        typingMessage.remove();

        addMessage({
            role: "bot",
            text: answerText,
            sourceUrl,
        });
    } catch (error) {
        typingMessage.remove();

        addMessage({
            role: "bot",
            text:
                error instanceof Error
                    ? error.message
                    : "Не удалось подключиться к серверу.",
            isError: true,
        });

        console.error("Chat request failed:", error);
    } finally {
        setSendingState(false);
        scrollToBottom();
    }
}

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
});

input.addEventListener("input", autoResizeInput);

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

document.querySelectorAll(".suggestion-chip").forEach((button) => {
    button.addEventListener("click", () => {
        sendMessage(button.textContent);
    });
});

clearChatButton.addEventListener("click", () => {
    const messages = chat.querySelectorAll(".message");

    messages.forEach((message, index) => {
        if (index !== 0) {
            message.remove();
        }
    });

    input.value = "";
    autoResizeInput();
    input.focus();
});

autoResizeInput();
input.focus();

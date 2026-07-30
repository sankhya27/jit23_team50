import { useState } from "react";

export default function AlertAssistant({ onExplain }) {

    const [input, setInput] = useState("");

    const [messages, setMessages] = useState([
        {
            role: "bot",
            text:
                "Hi 👋\n\nI'm DDoS Guard AI.\n\nI can explain DDoS attacks, confidence scores, detection results, mitigation strategies and network security concepts.\n\nChoose one of the suggestions below or ask your own question."
        }
    ]);

    const [loading, setLoading] = useState(false);

    const quickPrompts = [
        "Explain SYN Flood",
        "Explain UDP Flood",
        "Why was traffic blocked?",
        "How can I mitigate a DDoS attack?"
    ];

    async function askQuestion(question) {

        if (!question.trim()) return;

        setMessages(prev => [
            ...prev,
            {
                role: "user",
                text: question
            }
        ]);

        setLoading(true);

        setInput("");

        try {

            const response = await onExplain(question);

            setMessages(prev => [
                ...prev,
                {
                    role: "bot",
                    text:
                        response ||
                        "I couldn't answer that right now. Please try again."
                }
            ]);

        }

        catch {

            setMessages(prev => [
                ...prev,
                {
                    role: "bot",
                    text:
                        "Unable to contact the AI assistant."
                }
            ]);

        }

        setLoading(false);

    }

    function handleSubmit(event) {

        event.preventDefault();

        askQuestion(input);

    }

    return (

        <div className="assistant-chat">

            <div className="chat-header">

                <div className="chat-avatar">

                    🤖

                </div>

                <div>

                    <h3>

                        DDoS Guard AI

                    </h3>

                    <p>

                        Your Cybersecurity Assistant

                    </p>

                </div>

            </div>

            <div className="chat-window">

                {

                    messages.map((message,index)=>(

                        <div

                            key={index}

                            className={`chat-bubble ${message.role}`}

                        >

                            <p
                                style={{
                                    whiteSpace:"pre-line"
                                }}
                            >

                                {message.text}

                            </p>

                        </div>

                    ))

                }

                {

                    loading &&

                    <div className="chat-bubble bot">

                        <p>

                            🤖 Thinking...

                        </p>

                    </div>

                }

            </div>

            <div className="quick-prompts">

                {

                    quickPrompts.map(prompt=>(

                        <button

                            key={prompt}

                            type="button"

                            onClick={() => askQuestion(prompt)}

                        >

                            {prompt}

                        </button>

                    ))

                }

            </div>

            <form

                className="chat-form"

                onSubmit={handleSubmit}

            >

                <input

                    type="text"

                    value={input}

                    onChange={(e)=>

                        setInput(e.target.value)

                    }

                    placeholder="Ask about DDoS attacks, mitigation, alerts..."

                    disabled={loading}

                />

                <button

                    className="btn btn-primary"

                    type="submit"

                    disabled={loading}

                >

                    {

                        loading

                        ?

                        "Thinking..."

                        :

                        "Send"

                    }

                </button>

            </form>

        </div>

    );

}
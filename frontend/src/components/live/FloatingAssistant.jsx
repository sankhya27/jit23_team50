import { useEffect, useRef, useState } from "react";
import AlertAssistant from "../AlertAssistant";

export default function FloatingAssistant({ onExplain }) {
    const [open, setOpen] = useState(false);

    const wrapperRef = useRef(null);

    useEffect(() => {

        function handleClickOutside(e) {

            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target)
            ) {
                setOpen(false);
            }

        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

    }, [open]);

    return (
        <div
            ref={wrapperRef}
            className="floating-ai-wrapper"
        >

            <button
                className={`floating-ai-btn ${open ? "active" : ""}`}
                onClick={() => setOpen(!open)}
            >

                <span className="pulse"></span>

                🤖

            </button>

            <div
                className={`floating-ai-window ${
                    open ? "show" : ""
                }`}
            >

                <div className="floating-ai-header">

                    <div className="floating-ai-title">

                        <div className="ai-avatar">

                            AI

                        </div>

                        <div>

                            <strong>

                                DDoS Guard AI

                            </strong>

                            <div className="ai-status">

                                <span className="online-dot"></span>

                                Online

                            </div>

                        </div>

                    </div>

                    <button
                        className="close-ai"
                        onClick={() => setOpen(false)}
                    >

                        ✕

                    </button>

                </div>

                <AlertAssistant
                    onExplain={onExplain}
                />

            </div>

        </div>
    );
}
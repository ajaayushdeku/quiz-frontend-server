import React, { useState } from "react";
import "../../styles/Quiz.css";
import { useTextSpeaker } from "../../hooks/useTextSpeaker"; // import hook

const QuestionCard = ({ mediaType, mediaUrl, displayedText, category }) => {
  const [showModal, setShowModal] = useState(false);
  const { speakText, stopSpeaking, speaking, voices } = useTextSpeaker(
    "Google UK English Male",
    "en-US"
  );

  //   1 'Microsoft David - English (United States)' 'en-US' true true
  //   2 'Microsoft Mark - English (United States)' 'en-US' false true
  //   3 'Microsoft Zira - English (United States)' 'en-US' false true
  //   4 'Google US English' 'en-US' false false
  //   5 'Google UK English Female' 'en-GB' false false
  //   6 'Google UK English Male' 'en-GB' false false

  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  // Detect media type if set to "file"
  let mediaTypeFinal = mediaType;
  if (mediaType === "file") {
    if (mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i))
      mediaTypeFinal = "image";
    else if (mediaUrl?.match(/\.(mp4|mov|webm|avi)$/i))
      mediaTypeFinal = "video";
  }

  // Speak formatted sentence instead of "Q"
  const speakQuestion = () => {
    const textToSpeak = `   Question: ${displayedText}`;
    speaking ? stopSpeaking() : speakText(textToSpeak);
  };

  return (
    <>
      <section className="quiz-questions">
        <div className="questions-container">
          <div className="qn">
            Q. {displayedText}
            {/* Button to speak text */}
            <button
              className={`speak-text-btn ${speaking ? "stop-speech" : ""}`}
              onClick={speakQuestion}
            >
              {speaking ? "🔇 Stop" : "🔊 Speak"}
            </button>
            {/* Media display */}
            <div className="media-container">
              {mediaTypeFinal === "image" && mediaUrl && (
                <img
                  src={mediaUrl}
                  alt="Question Media"
                  className="quiz-image"
                  onError={(e) => (e.target.style.display = "none")}
                  onClick={handleOpen}
                  style={{
                    marginTop: "2rem",
                    cursor: "pointer",
                    borderRadius: "10px",
                  }}
                />
              )}

              {mediaTypeFinal === "video" && mediaUrl && (
                <video
                  src={mediaUrl}
                  controls
                  className="quiz-video"
                  onError={(e) => (e.target.style.display = "none")}
                  onClick={handleOpen}
                  style={{
                    marginTop: "2rem",
                    cursor: "pointer",
                    borderRadius: "10px",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Modal */}
      {showModal && (
        <div className="media-modal" onClick={handleClose}>
          <div
            className="media-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {mediaTypeFinal === "image" ? (
              <div className="media-container">
                <img
                  src={mediaUrl}
                  alt="Fullscreen"
                  className="fullscreen-media"
                />
              </div>
            ) : (
              <div className="media-container">
                <video
                  src={mediaUrl}
                  controls
                  autoPlay
                  className="fullscreen-media"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionCard;

import React, { useState } from "react";
import "../../styles/Quiz.css";

const QuestionCard = ({ mediaType, mediaUrl, displayedText, category }) => {
  const [showModal, setShowModal] = useState(false);

  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  // Detect media type if set to "file"
  if (mediaType === "file") {
    if (mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i)) mediaType = "image";
    else if (mediaUrl.match(/\.(mp4|mov|webm|avi)$/i)) mediaType = "video";
  }

  return (
    <>
      {" "}
      <section className="quiz-questions">
        <div className="questions-container">
          <div className="qn">
            {/* Category */}
            {category && <div className="quiz-category">{category}</div>}

            {displayedText}

            {/* Media display */}
            <div className="media-container">
              {mediaType === "image" && mediaUrl && (
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
            </div>

            {mediaType === "video" && mediaUrl && (
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

            {/* Fullscreen Modal */}
          </div>
        </div>
      </section>
      {showModal && (
        <div className="media-modal" onClick={handleClose}>
          <div
            className="media-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {mediaType === "image" ? (
              <div className="media-container">
                {" "}
                <img
                  src={mediaUrl}
                  alt="Fullscreen"
                  className="fullscreen-media"
                />
              </div>
            ) : (
              <div className="media-container">
                {" "}
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

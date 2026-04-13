import React from 'react';
import '../styles/BackgroundVideo.css';

export const BackgroundVideo = () => {
  return (
    <div className="background-video-container">
      <video autoPlay muted loop className="background-video">
        <source src="/bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="video-overlay"></div>
    </div>
  );
};

export default BackgroundVideo;

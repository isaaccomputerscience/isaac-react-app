import React from "react";

interface TestimonialCommentProps {
  imageSrc: string;
  altText: string;
  text: string;
}

const TestimonialComment: React.FC<TestimonialCommentProps> = ({ imageSrc, altText, text }) => (
  <div className="resources-center-container">
    <div className="resources-comment">
      <div className="resources-comment-content">
        <img src={imageSrc} alt={altText} className="star-img" />
        <p className="text-left my-3 mx-3">{text}</p>
      </div>
    </div>
  </div>
);

export default TestimonialComment;

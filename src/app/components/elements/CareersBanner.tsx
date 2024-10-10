import React from "react";
import { Col, Container, Row } from "reactstrap";
import { selectors, useAppSelector } from "../../state";
import { isStudent } from "../../services";
import careerVideos from "../../assets/career_videos.json";
import { Link } from "react-router-dom";
import starSVG from "../../../../public/assets/star.svg";

const CsAtWorkDescription = () => {
  const user = useAppSelector(selectors.user.orNull);
  const loggedOutDescription =
    "Enrich your understanding of computer science curriculum topics with our video resources. Watch a Computing Ambassador introduce a topic and share what they do in their day-to-day job.";
  const student =
    "Wondering how studying computer science can help you in your future job or where would you ever use this knowledge? Our new video resources are here to show you the real-world application of your learning. Watch a Computing Ambassador introduce a topic and share what they do in their day-to-day job.";
  const teacherOrAbove =
    "Looking at how to connect your students' learning of computer science and the real world of work? Our new video resources are here to help you bring the curriculum topics to life with Computing Ambassadors introducing topics and sharing what they do in their day-to-day job. And";

  const roleSpecificDescription = isStudent(user) ? student : teacherOrAbove;

  return <p className="mb-3">{!user?.loggedIn ? loggedOutDescription : roleSpecificDescription}</p>;
};

const videoId = careerVideos[0].video;

export const CareersBanner = () => {
  const user = useAppSelector(selectors.user.orNull);
  return (
    <Container className="career-section">
      <h4 className="career-title">Careers in Computer Science</h4>
      <Row className="career-media-row">
        <Col className="d-flex">
          <img src="/assets/cs_journeys.svg" alt="cs journeys" className="career-media-row-image" />
          <div className="career-text-row-column">
            <h4 className="career-subtitle">Computer Science Journeys</h4>
            <p className="career-text">
              Discover our interview series and learn from passionate educators and recent computer science graduates in
              the Isaac community, who are excelling in various computing fields.
            </p>
            <Col className="career-link-column">
              <Link className="career-link" to={`/pages/computer_science_journeys_gallery`}>
                Read our interviews
              </Link>
            </Col>
          </div>
        </Col>
        <Col>
          <div className="career-media-row-column">
            <iframe
              title="career-video"
              className="career-media-row-video no-border"
              id="ytplayer"
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&fs=1&modestbranding=1`}
              allowFullScreen
            />
          </div>
          <div className="career-text-row-column">
            <h4 className="career-subtitle">
              {isStudent(user) ? "Linking computer science to the real world" : "Computer Science at work"}
            </h4>
            <div className="career-text">
              <CsAtWorkDescription />
            </div>
            <Col className="career-link-column">
              <Link className="career-link" to={`/careers_in_computer_science`}>
                See more career videos
              </Link>
            </Col>
          </div>
        </Col>
      </Row>
      <div className="career-comment">
        <div className="resources-comment-content">
          <img src={starSVG} alt="Star" className="star-img" />
          <p>
            Students have been able to dive deeper into topics by using Isaac CS, which has led to further interest and
            helped them understand what topics they may like to study in post 16 and post 18 study.
          </p>
        </div>
      </div>
    </Container>
  );
};

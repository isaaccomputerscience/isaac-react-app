import React from "react";
import { Card, CardBody, CardImg, CardText, CardTitle, Col, Container, Row } from "reactstrap";
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
    "Looking at how to connect your students' learning of computer science and the real world of work? Our new video resources are here to help you bring the curriculum topics to life with Computing Ambassadors introducing topics and sharing what they do in their day-to-day job.";

  const roleSpecificDescription = isStudent(user) ? student : teacherOrAbove;

  return <p className="mb-3">{!user?.loggedIn ? loggedOutDescription : roleSpecificDescription}</p>;
};

interface CareerCardProps {
  imgSrc?: string;
  imgAlt?: string;
  title: string;
  text: string | JSX.Element;
  linkTo: string;
  linkText: string;
  children?: React.ReactNode;
}

const CareerCard = ({ imgSrc, imgAlt, title, text, linkTo, linkText, children }: CareerCardProps) => (
  <Card className="career-card">
    {imgSrc && <CardImg variant="top" src={imgSrc} alt={imgAlt} className="career-media-row-image" />}
    <CardBody className="career-card-body">
      {children}
      <CardTitle className="career-subtitle">{title}</CardTitle>
      <CardText className="career-text">{text}</CardText>
      <div className="career-link-column">
        <Link className="career-link" to={linkTo}>
          {linkText}
        </Link>
      </div>
    </CardBody>
  </Card>
);

const videoId = careerVideos[0].video;

export const CareersBanner = () => {
  const user = useAppSelector(selectors.user.orNull);
  return (
    <Container className="pt-4 pb-5">
      <div className="career-background-img">
        <Container className="career-section">
          <h4 className="career-title">Careers</h4>
          <Row className="career-media-row">
            <Col>
              <CareerCard
                imgSrc="/assets/cs_journeys.svg"
                imgAlt="cs journeys"
                title="Computer Science Journeys"
                text="Discover our interview series and learn from passionate educators within the Isaac community, and recently graduated computer scientists, who are doing amazing things in a huge range of computing-related fields."
                linkTo="/pages/computer_science_journeys_gallery"
                linkText="Read our interviews"
              />
            </Col>
            <Col>
              <CareerCard
                title={isStudent(user) ? "Linking computer science to the real world" : "Computer Science at work"}
                text={<CsAtWorkDescription />}
                linkTo="/careers_in_computer_science"
                linkText="See more career videos"
              >
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
              </CareerCard>
            </Col>
          </Row>
          <div className="career-comment">
            <div className="resources-comment-content">
              <img src={starSVG} alt="Star" className="star-img" />
              <p className="text-left my-3 mx-3">
                Students have been able to dive deeper into topics by using Isaac CS, which has led to further interest
                and helped them understand what topics they may like to study in post 16 and post 18 study.
              </p>
            </div>
          </div>
        </Container>
      </div>
    </Container>
  );
};

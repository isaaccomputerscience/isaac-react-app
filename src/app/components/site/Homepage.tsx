import React, { useEffect } from "react";
import { useAppSelector, selectors, isaacApi } from "../../state";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";
import { SITE_SUBJECT_TITLE } from "../../services";
import { NewsCarousel } from "../elements/NewsCarousel";
import { EventsCarousel } from "../elements/EventsCarousel";
import classNames from "classnames";
import { Dashboard } from "../elements/Dashboard";
import { CareersBanner } from "../elements/CareersBanner";
import questionFinderSVG from "../../../../public/assets/q-finder.svg";

export const Homepage = () => {
  useEffect(() => {
    document.title = "Isaac " + SITE_SUBJECT_TITLE;
  }, []);

  const user = useAppSelector(selectors.user.orNull);

  const { data: news } = isaacApi.endpoints.getNewsPodList.useQuery({
    subject: "news",
    orderDescending: true,
  });

  const { data: promo } = isaacApi.endpoints.getNewsPodList.useQuery({
    subject: "promo",
    orderDescending: true,
  });

  const [teacherPromoItem] = promo
    ? [
        promo.find((item) => item && !item?.id?.includes("public")),
        promo.find((item) => item && item?.id?.includes("public")),
      ]
    : [undefined, undefined];

  const featuredNewsItem = news && user?.loggedIn ? news[0] : undefined;

  const carouselNewsItems = news;

  return (
    <>
      <div id="homepage">
        <section id="call-to-action" className={`homepageHero ${user?.loggedIn ? "pb-lg-4" : ""}`}>
          <Container className="pt-4 z1">
            <Dashboard promoItem={teacherPromoItem} featuredNewsItem={featuredNewsItem} />
          </Container>
        </section>

        {!user?.loggedIn && (
          <section id="events" className="event-section">
            <div className="event-section-background-img">
              <Container className="pt-4 pb-5">
                <div className="eventList pt-5 pattern-03">
                  <h2 className="homepage-sub-title text-left mb-4">Events</h2>
                  <p className="pt-4 pb-2 event-text-description text-left">
                    {
                      "We offer free online events for students. Choose from our booster events to support revision and improve understanding of classroom learning, or our discovery events, to explore the career possibilities that computer science opens up."
                    }
                  </p>
                  <EventsCarousel />
                  <div className="center-container">
                    <Link className="browse-events" to="/events">
                      Browse all events
                    </Link>
                  </div>
                </div>
              </Container>
            </div>
          </section>
        )}

        {!user?.loggedIn && (
          <section id="resources" className="resources-section">
            <Container className="pt-4 pb-5">
              <div className="pt-5">
                <h2 className="homepage-sub-title text-left mb-4">Resources</h2>
              </div>
              <Row>
                <div className="columns-container">
                  <Col className="custom-col-60">
                    <div className="resources-background">
                      <p className="resources-sub-heading">Computer science topics</p>
                      <p className="resources-text-description">
                        {
                          "Discover our free computer science topics and questions, mapped to the leading exam specifications in England. Review key curriculum areas and get specific feedback to address common misconceptions."
                        }
                      </p>
                      <div className="center-container">
                        <Link className="resources-links" to="/topics/gcse">
                          GCSE topics
                        </Link>
                        <Link className="resources-links" to="/topics/a_level">
                          A level topics
                        </Link>
                      </div>
                    </div>
                  </Col>
                  <Col className="custom-col-30">
                    <div className="resources-background">
                      <div className="resources-sub-heading-container">
                        <p className="resources-sub-heading">Question finder</p>
                        <div className="tooltip-container">
                          <img src={questionFinderSVG} alt="Question Finder" className="q-finder-image" />
                          <span className="tooltip-text">
                            You can build a gameboard by selecting the areas of interest, stage and difficulties.
                            <br />
                            You can select more than one entry in each area.
                          </span>
                        </div>
                      </div>
                      <p className="resources-text-description">
                        {"Specify your search criteria and we’ll generate a random selection of up to 10 questions!"}
                      </p>
                      <div className="center-container">
                        <Link className="resources-links" to="/topics/gcse">
                          Question finder
                        </Link>
                      </div>
                    </div>
                  </Col>
                </div>
              </Row>
            </Container>
          </section>
        )}

        <section id="careers" className="banner-primary pattern-05 p-5">
          <CareersBanner />
        </section>

        <section id="news">
          <Container
            className={classNames("pt-4 pb-5", {
              "mt-n4 pt-lg-0": user?.loggedIn ?? false,
            })}
          >
            <div data-testid={"news-carousel"} className="eventList pt-3 pt-md-4 pattern-03-reverse">
              <h2 className="h-title mb-4 pt-lg-3">News</h2>
              <NewsCarousel items={carouselNewsItems} />
            </div>
          </Container>
        </section>

        {user?.loggedIn && (
          <section id="events">
            <Container className="pt-4 pb-5">
              <div className="eventList pt-5 pattern-03">
                <h2 className="h-title text-center mb-4">Events</h2>
                <p className="pt-4 pb-2 event-description text-center col-md-8 offset-md-2">
                  {"We offer free online events for students. Visit our "}
                  <Link to="/events">Events page</Link>
                  {" to see what’s happening, and sign up today!"}
                </p>
                <EventsCarousel />
                <Link to="/events">See all Events</Link>
              </div>
            </Container>
          </section>
        )}
      </div>
    </>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import { selectors, useAppSelector } from "../../state";
import { Col, Container, Row } from "reactstrap";
import { MainSearch } from "../elements/MainSearch";
import { NavigationBar } from "./NavigationBar";

export const Header = () => {
  const user = useAppSelector(selectors.user.orNull);
  const mainContentId = useAppSelector(selectors.mainContentId.orDefault);
  return (
    <header className="light" data-testid={"header"}>
      <Container className="container-fluid px-0">
        <Row>
          <Col>
            <div className="header-bar mx-3 mx-md-3 py-3 d-md-flex">
              <div className="header-logo">
                <Link to="/">
                  <img src="/assets/logo.svg" alt="Isaac Computer Science" />
                </Link>
              </div>

              <a href={`#${mainContentId}`} className="skip-main">
                Skip to main content
              </a>

              <div className="header-links ml-auto pr-3 px-md-3 d-flex align-items-center d-print-none">
                {user &&
                  (!user.loggedIn ? (
                    <React.Fragment>
                      <div className="login mx-5 mx-sm-2 d-flex flex-row">
                        <Link to="/login" className="mr-3">
                          <span>Log in</span>
                        </Link>
                        <Link to="/register">
                          <span>Sign up</span>
                        </Link>
                      </div>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <div className="my-account mx-5 mx-sm-2 d-md-flex flex-md-row">
                        <Link to="/account" className="mr-md-3">
                          <span>My Account</span>
                        </Link>
                        <Link to="/logout">
                          <span>Logout</span>
                        </Link>
                      </div>
                    </React.Fragment>
                  ))}
              </div>

              <div className="header-search m-md-0 ml-md-auto align-items-center d-print-none">
                <MainSearch />
              </div>
            </div>

            <NavigationBar />
          </Col>
        </Row>
      </Container>
    </header>
  );
};

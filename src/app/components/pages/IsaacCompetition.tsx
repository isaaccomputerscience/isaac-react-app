import React, { useEffect } from "react";
import { SITE_SUBJECT_TITLE } from "../../services";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";
import "../../../scss/cs/competition.scss";

export const IsaacCompetition = () => {
  useEffect(() => {
    document.title = "Isaac " + SITE_SUBJECT_TITLE;
  }, []);

  return (
    <>
      <TitleAndBreadcrumb currentPageTitle="Isaac Competition" breadcrumbTitleOverride="Isaac Competition" />

      <div id="section1">
        <h1>Section 1</h1>
      </div>

      <section id="internetOfEverything" className="event-section">
        <div className="event-section-background-img">
          <div className="container">
            <div className="row ioe-row pl-2 pr-2 pt-4 pb-4">
              <div className="ioe-custom-width ioe-col p-4 rounded">
                <h3 className="ioe-title">What is the Internet of Everything?</h3>
                <p className="ioe-text pt-3">
                  Imagine a world where everything around you is connected to the internet. Not just your phone or
                  computer, but your watch, your shoes, your fridge, even your toothbrush! This is what we call the
                  Internet of Everything.
                </p>
                <p className="ioe-text pt-3">
                  The IoE is like a giant invisible web that connects all things, people, data, and processes. It’s like
                  a big team where everyone and everything works together, sharing information and making decisions.
                </p>
                <p className="ioe-text pt-3">
                  In this competition, students will create a concept or prototype for an IoE product and showcase it
                  through a video submission.
                </p>
              </div>
              <div className="ioe-custom-width ioe-col p-4 rounded">
                <h3 className="ioe-title">Real-life examples of IoE include:</h3>
                <ul className="ioe-text pt-3">
                  <li>
                    smart homes: imagine your alarm clock wakes you up and then automatically tells your coffee maker to
                    start brewing coffee
                  </li>
                  <li>
                    wearable devices: devices like smartwatches can monitor your health, track your location if you’re
                    lost, and even let you make phone calls or send messages
                  </li>
                  <li>
                    smart cities: streetlights that turn off when it is light outside, or traffic lights that adjust
                    based on road conditions
                  </li>
                  <li>
                    connected cars: cars can communicate with each other to avoid accidents. They can also tell you when
                    they need repairs or even call for help if there’s an emergency
                  </li>
                </ul>
              </div>
              <div className="p-1">
                <div className="d-flex align-items-center justify-content-center bg-light p-4 text-center flex-row ioe-content">
                  <img src="/assets/star.svg" alt="Star" className="star-img mb-3 mb-md-0" />
                  <p className="text-left my-2 mx-2">
                    The Internet of Everything isn’t just about smart devices; it’s about connecting everything to make
                    life easier, safer, and more enjoyable. It’s like a superpower that lets us make objects work
                    together — but we must use this power responsibly and safely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

import React from "react";
import { closeActiveModal, store } from "../../../state";
import { Button, CardBody, Col } from "reactstrap";

// N.B. This modal must not be referenced in index.tsx to avoid circular dependencies

const PolicyUpdateBody = () => (
  <CardBody className="p-0">
    <div className="small pb-2">
      With this update, we have clarified the role of National Center for Computing Education (NCCE), the types of data
      we collect (such as your school affiliation), how to contact us, and the date we will keep your personal data
      until for the purposes of evaluation of the Isaac Computer Science Program.
    </div>
    <div className="small pb-2">
      To continue using the platform, you&apos;ll need to review and accept the updated{" "}
      <a href="/privacy">Privacy Policy</a>.
    </div>
    <div className="small pb-2">
      <a href="/privacy">View Privacy Policy</a>
    </div>
    <div className="text-center flex pb-3">
      <Col xs={12} lg={4} className="py-1 mx-auto">
        <Button
          className="btn btn-secondary border-0 px-0 px-md-2 my-1"
          size="lg"
          block
          color="secondary"
          style={{ fontWeight: "900" }}
          target="_blank"
          onClick={() => {
            store.dispatch(closeActiveModal());
          }}
        >
          Agree and Continue
        </Button>
      </Col>
    </div>
  </CardBody>
);

export const policyUpdateModal = {
  title: "We've updated our Privacy Policy",
  body: <PolicyUpdateBody />,
};

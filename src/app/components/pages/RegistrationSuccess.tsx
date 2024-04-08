import React from "react";
import { Card, CardBody, Container } from "reactstrap";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";
import { REGISTER_CRUMB } from "../../services";

export const RegistrationSuccess = () => {
  return (
    <Container id="registration-success" className="mb-5">
      <TitleAndBreadcrumb
        currentPageTitle="Thanks for signing up"
        intermediateCrumbs={[REGISTER_CRUMB]}
        className="mb-4"
      />
      <Card>
        <CardBody className="text-center">
          <h3>Thank you for providing the required account information.</h3>
          <p> An email has been sent to your provided email address to complete the registration process.</p>
        </CardBody>
      </Card>
    </Container>
  );
};

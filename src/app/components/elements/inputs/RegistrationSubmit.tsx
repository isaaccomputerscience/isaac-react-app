import React from 'react'
import { Link } from 'react-router-dom'
import { Col, Input, Row } from 'reactstrap'

export const RegistrationSubmit = () => {
  return (
    <>
    <Row>
    <Col className="text-center text-muted mt-3">
      {"By clicking 'Register my account', you accept our "}
      <Link to="/terms" target="_blank">
        Terms of Use
      </Link>
      . Find out about our{" "}
      <Link to="/privacy" target="_blank">
        Privacy Policy
      </Link>
      .
    </Col>
  </Row>

  <Row className="mt-4 mb-2">
    <Col md={{ size: 6, offset: 3 }}>
      <Input
        type="submit"
        value="Register my account"
        className="btn btn-block btn-secondary border-0"
      />
    </Col>
  </Row>
  </>
  )
}

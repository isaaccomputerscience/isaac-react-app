import React from "react";
import { IsaacPodDTO } from "../../../IsaacApiTypes";
import { apiHelper } from "../../services";
import { Col, Row } from "reactstrap";
import { IsaacContentValueOrChildren } from "../content/IsaacContentValueOrChildren";

export const PromoContent = ({ item }: { item: IsaacPodDTO }) => {
  const { title, subtitle, value, image, url } = item;

  const path = image && image.src && apiHelper.determineImageUrl(image.src);
  return (
    <div className="text-center">
      <div className="profile-image">
        <img src={path} alt={image?.altText} />
      </div>
      <Row className="profile-titles">
        <Col>
          <div className="profile-title">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <b>{title}</b>
            </a>
          </div>
        </Col>
      </Row>
      <div className="profile-description">
        <IsaacContentValueOrChildren encoding={item.encoding} value={value} />
      </div>
      <div>
        <a href={url} target="_blank" rel="noopener noreferrer">
          {subtitle}
        </a>
      </div>
    </div>
  );
};

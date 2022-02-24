import React from "react";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import {Link} from "react-router-dom";
import classNames from "classnames";

export interface ConceptGameboardButtonProps {
    className?: string;
    conceptId?: string;
}

export const ConceptGameboardButton = ({conceptId, className} : ConceptGameboardButtonProps) => {

    // Currently PHY doesn't use this
    const gameboardGenerateHref = {
        [SITE.PHY]: `/gameboard_builder?concepts=${conceptId}`,
        [SITE.CS]: `/gameboard_builder?concepts=${conceptId}`
    }[SITE_SUBJECT]

    return <Link className={classNames(className, "btn btn-sm btn-primary")} to={gameboardGenerateHref} >
        Generate a gameboard
    </Link>
}

import React from "react";
import {NewsCard} from "./cards/NewsCard";
import {IsaacPodDTO} from "../../../IsaacApiTypes";
import {ShowLoading} from "../handlers/ShowLoading";

export const PromoItem = ({item}: {item: IsaacPodDTO | undefined}) =>
    <ShowLoading until={item} thenRender={newsItem =>
        <div className={"my-lg-1 mx-auto p-lg-4 featured-news-item"}>
            <NewsCard newsItem={newsItem} showTitle linkText={newsItem.subtitle}/>
        </div>
    } />

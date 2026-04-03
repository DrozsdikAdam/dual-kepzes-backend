// Időzóna beállítás — az alkalmazás kizárólag Magyarországon használt
process.env.TZ = "Europe/Budapest";

import dotenv from "dotenv";
dotenv.config();

// JSON válaszokban Budapest időt küldünk UTC helyett
// Az Intl API-t használjuk, ami OS-től függetlenül mindig helyes Budapest időt ad
const budapestFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
});

const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
});

function getPartsMap(formatter: Intl.DateTimeFormat, date: Date) {
    const map: Record<string, string> = {};
    for (const p of formatter.formatToParts(date)) {
        map[p.type] = p.value;
    }
    return map;
}

Date.prototype.toJSON = function () {
    const bp = getPartsMap(budapestFormatter, this);
    const utc = getPartsMap(utcFormatter, this);
    const ms = String(this.getMilliseconds()).padStart(3, "0");

    // Offset kiszámítása: Budapest helyi idő vs UTC összehasonlítás
    const bpTotalMin =
        parseInt(bp.day) * 1440 + parseInt(bp.hour) * 60 + parseInt(bp.minute);
    const utcTotalMin =
        parseInt(utc.day) * 1440 + parseInt(utc.hour) * 60 + parseInt(utc.minute);

    let offsetMin = bpTotalMin - utcTotalMin;
    // Hónap/napváltás korrekció (pl. 23:30 UTC → 00:30+1 Budapest)
    if (offsetMin < -720) offsetMin += 1440;
    if (offsetMin > 720) offsetMin -= 1440;

    const sign = offsetMin >= 0 ? "+" : "-";
    const hh = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, "0");
    const mm = String(Math.abs(offsetMin) % 60).padStart(2, "0");

    return (
        `${bp.year}-${bp.month}-${bp.day}T` +
        `${bp.hour}:${bp.minute}:${bp.second}.` +
        `${ms}${sign}${hh}:${mm}`
    );
};

import app from "./app";
import "./services/email.worker";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
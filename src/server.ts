// Időzóna beállítás — az alkalmazás kizárólag Magyarországon használt
process.env.TZ = "Europe/Budapest";

import dotenv from "dotenv";
dotenv.config();

// JSON válaszokban Budapest időt küldünk UTC helyett
Date.prototype.toJSON = function () {
    const pad = (n: number) => String(n).padStart(2, "0");
    const pad3 = (n: number) => String(n).padStart(3, "0");
    const offset = -this.getTimezoneOffset(); // percben
    const sign = offset >= 0 ? "+" : "-";
    const hh = pad(Math.floor(Math.abs(offset) / 60));
    const mm = pad(Math.abs(offset) % 60);

    return (
        this.getFullYear() + "-" +
        pad(this.getMonth() + 1) + "-" +
        pad(this.getDate()) + "T" +
        pad(this.getHours()) + ":" +
        pad(this.getMinutes()) + ":" +
        pad(this.getSeconds()) + "." +
        pad3(this.getMilliseconds()) +
        sign + hh + ":" + mm
    );
};

import app from "./app";
import "./services/email.worker";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
/*
 * Copyright (c) 2018 Richard L. McNeary II
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


import { Moment } from "moment";
import * as momentObj from "moment-timezone";
import { StopSchedule } from "../app/interfaces";


const LOCATION_TIME_ZONE = "America/New_York";
const moment = momentObj.default;


export default {

    getCurrentStops<T extends StopSchedule>(stops: T[] = []): T {
        // const locationNow = getLocationTime();
        // for (const schedule of stops) {
        //     const begin = moment(schedule.dates.begin);
        //     const end = moment(schedule.dates.end);
        //     if (locationNow.isBefore(begin) || end.isBefore(locationNow)) {
        //         continue;
        //     }

        //     const first = moment(schedule.hours.first);
        //     const last = moment(schedule.hours.last);
        //     if (locationNow.isBefore(first) || last.isBefore(locationNow)) {
        //         continue;
        //     }

        //     return schedule as any;
        // }
        return stops[0];
    },

    /**
     * Convert local time to Acadia time.
     */
    getLocationTime(): Date {
        return getLocationTime().toDate();
    }

};


function getLocationTime(): Moment {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone ? moment().tz(timezone).tz(LOCATION_TIME_ZONE) : moment().tz(LOCATION_TIME_ZONE);
}

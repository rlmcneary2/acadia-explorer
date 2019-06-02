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
const moment = (momentObj as any).default;


export default {

    createMoment(date: string, hour: string, tz: string = LOCATION_TIME_ZONE): Moment {
        return createMoment(date, hour, tz);
    },

    getCurrentStops<T extends StopSchedule>(stops: T[] = [], debug = false): T {
        if (debug) {
            return stops[0];
        }

        const locationNow = getLocationTime();
        for (const schedule of stops) {
            if (serviceActive(schedule, locationNow)) {
                return schedule;
            }
        }
    },

    /**
     * Convert local time to Acadia time.
     */
    getLocationTime(): Date {
        return getLocationTime().toDate();
    },

    serviceResumes(stops: StopSchedule[]): { date: Moment; isNextYear: boolean; schedule: StopSchedule } {
        if (!stops || !stops.length) {
            throw Error("No scheduled stops provided.");
        }

        const locationNow = getLocationTime();
        const sorted = stops
            .map(schedule => ({ ...serviceResumes(schedule, locationNow), schedule }))
            .sort((a, b) => {
                if (a.date && b.date) {
                    if (b.date.isBefore(a.date)) {
                        return -1;
                    } else if (a.date.isBefore(b.date)) {
                        return 1;
                    }

                    return 0;
                }

                if (a.isNextYear && !b.isNextYear) {
                    return -1;
                }

                return 0;
            });

        return sorted[0];
    }

};


function createMoment(date: string, hour: string, tz: string = LOCATION_TIME_ZONE): Moment {
    return moment.tz(`${date}T${hour}`, tz);
}

function getLocationTime(): Moment {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone && timezone !== "Etc/Unknown" ? moment().tz(timezone).tz(LOCATION_TIME_ZONE) : moment().tz(LOCATION_TIME_ZONE);
}

function serviceActive(schedule: StopSchedule, now: Moment): boolean {
    const begin = moment(schedule.dates.begin);
    const end = moment(schedule.dates.end);
    if (now.isBefore(begin) || end.isBefore(now)) {
        return false;
    }

    const first = moment(schedule.hours.first);
    const last = moment(schedule.hours.last);
    if (now.isBefore(first) || last.isBefore(now)) {
        return false;
    }

    return true;
}


function serviceResumes(schedule: StopSchedule, now: Moment): { date: Moment; isNextYear: boolean; } {
    const begin: Moment = createMoment(schedule.dates.begin, schedule.hours.first);
    const end: Moment = createMoment(schedule.dates.end, schedule.hours.first);

    const result: { date: Moment; isNextYear: boolean } = {
        date: null,
        isNextYear: false
    };

    if (now.isBefore(begin)) {
        result.date = begin;
    } else if (now.isBefore(end)) {
        result.date = end;
    } else {
        result.isNextYear = true;
    }

    return result;
}

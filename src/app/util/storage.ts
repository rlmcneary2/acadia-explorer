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


const storage: Readonly<Storage> = Object.freeze({

    async get<T>(key: string): Promise<T> {
        const item = localStorage.getItem(key);

        // tslint:disable-next-line
        if (item == null) { // This is a valid check for both null and undefined.
            return null;
        }

        const parsed = JSON.parse(item);
        const result = typeof parsed !== "string" ? parsed as T : (item as any) as T;
        return result;
    },

    async set(key: string, value: any): Promise<void> {
        const item: string = typeof value !== "string" ? JSON.stringify(value) : value;
        localStorage.setItem(key, item);
    }

});


interface Storage {
    get<T>(key: string): Promise<T>;
    set(key: string, value: any): Promise<void>;
}


export { storage };

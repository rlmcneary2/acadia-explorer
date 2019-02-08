"use strict";
/*
 * Copyright (c) 2019 Richard L. McNeary II
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


const CopyWebpackPlugin = require("copy-webpack-plugin");
const fs = require("fs");
const { GenerateSW } = require("workbox-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const WriteFilePlugin = require("write-file-webpack-plugin");

/**
 * Get the plugins for webpack.
 * @param {boolean} isDebug
 * @returns {any[]}
 */
module.exports = (isDebug) => {
    const plugins = [
        new webpack.BannerPlugin({
            banner: fs.readFileSync("./LICENSE", "utf8")
        }),
        new HtmlWebpackPlugin({
            inject: "head",
            template: "./src/index.template.html",
            title: "Acadia Island Explorer"
        }),
        new MiniCssExtractPlugin({ // create css files from the css.import
            filename: "[name].css"
        }),
        new CopyWebpackPlugin([{ // copy static data files
            from: "data"
        }, {
            from: "manifest.json"
        }, {
            from: "style/images/*.png"
        }, {
            from: "style/images/favicon.ico", to: "."
        }]),
        new WriteFilePlugin({ // so the dev server can access files that aren't part of the bundle (like the json files copied above)
            test: /(\.json$|\.png$|\.ico$)/,
            useHashIndex: true
        }),
        new GenerateSW(serviceWorkerOptions) // create the service worker
    ];

    if (!isDebug) {
        console.log("webpack.plugins.js - adding DefinePlugin.");
        plugins.push(new webpack.DefinePlugin({
            "process.env.NODE_ENV": "'production'" // Yes this string MUST be quoted for production to have full effect on minifying code.
        }));
    }

    return plugins;
};


const serviceWorkerOptions = {
    importWorkboxFrom: "local",
    navigateFallback: "/index.html", // this is an SPA so all app URLs can be resolved to this item in the cache
    runtimeCaching: [{
        handler: "cacheFirst",
        options: {
            cacheName: "tracker",
            expiration: {
                maxAgeSeconds: 7 * 24 * 60 * 60 // seconds in a week
            }
        },
        urlPattern: /^https:\/\/islandexplorertracker\.availtec\.com\/InfoPoint\/rest\/(Routes|Stops)\//
    }, {
        handler: "cacheFirst",
        options: {
            cacheName: "tracker",
            expiration: {
                maxAgeSeconds: 7 * 24 * 60 * 60 // seconds in a week
            }
        },
        urlPattern: /^https:\/\/islandexplorertracker\.availtec\.com\/InfoPoint\/Resources\/Traces\//
    }, {
        handler: "cacheFirst",
        options: {
            cacheName: "mapbox",
            expiration: {
                maxAgeSeconds: 7 * 24 * 60 * 60 // seconds in a week
            }
        },
        urlPattern: /^https:\/\/api\.mapbox\.com\//
    }, {
        handler: "cacheFirst",
        options: {
            cacheName: "mapbox",
            expiration: {
                maxAgeSeconds: 7 * 24 * 60 * 60, // seconds in a week
                maxEntries: 80
            }
        },
        urlPattern: /^https:\/\/[\w]\.tiles\.mapbox\.com\//
    }],
    swDest: "sw.js" // name of the output file with the service worker
};

"use strict";
/*
 * Copyright (c) 2017 Richard L. McNeary II
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


const babelOptions = require("./babel.config");
const convert = require("koa-connect");
const history = require("connect-history-api-fallback");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const path = require("path");
const plugins = require("./build/webpack.plugins");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");


const _OUTPUT_DIR = "dist";
const _SOURCE_DIR = "src";


/**
 * @module
 * This is a webpack 4 configuration file.
 */
const config = {
    devtool: "source-maps",
    entry: {
        app: `./${_SOURCE_DIR}/index.ts`
    },
    module: {
        rules: [
            {
                test: /\.svg$/,
                use: [{
                    loader: "url-loader",
                    options: { limit: 4096 }
                }]
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader"
                ]
            },
            {
                test: /\.tsx?$/,
                exclude: [
                    /(node_modules|bower_components)/
                ],
                use: [
                    {
                        loader: "awesome-typescript-loader",
                        options: {
                            babelCore: "@babel/core",
                            useBabel: true,
                            useCache: true,
                            babelOptions
                        }
                    }
                ]
            },
            {
                test: /\.jsx?$/,
                enforce: "pre",
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: "source-map-loader"
                    }
                ]
            }
        ]
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                parallel: true,
                uglifyOptions: {
                    output: { comments: false }
                }
            }),
            new OptimizeCssAssetsPlugin()
        ]
    },
    output: {
        chunkFilename: "[name].chunk.js",
        filename: "[name].js",
        globalObject: "this", // temporary workaround for https://github.com/webpack/webpack/issues/6642
        path: path.resolve(__dirname, _OUTPUT_DIR),
        publicPath: "/"
    },
    resolve: {
        alias: {
            "@action": path.resolve(__dirname, "src/app/action/"),
            "@controls": path.resolve(__dirname, "src/app/view/common/controls/"),
            "@reducer": path.resolve(__dirname, "src/app/reducer/"),
            "@util": path.resolve(__dirname, "src/app/util/")
        },
        extensions: [".js", "json", ".jsx", "scss", ".ts", ".tsx"]
    },
    serve: {
        content: path.resolve(__dirname, _OUTPUT_DIR),
        add: (app/*, middleware, options*/) => {
            app.use(convert(history()));
        }
    },
    target: "web"
};


module.exports = env => {
    console.log(`webpack.config.js - process.env.WEBPACK_SERVE: '${process.env.WEBPACK_SERVE}'.`);
    console.log(`webpack.config.js - env.NODE_ENV: '${env ? env.NODE_ENV : "undefined"}'.`);

    let mode = "development";
    if (!process.env.WEBPACK_SERVE && env && env.NODE_ENV === "production") {
        mode = "production";
    }

    config.mode = mode;
    console.log(`webpack.config.js - mode: '${config.mode}'.`);

    config.plugins = plugins(mode !== "production");

    return config;
};

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


const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const convert = require('koa-connect');
const history = require('connect-history-api-fallback');


const _OUTPUT_DIR = "dist";
const _SOURCE_DIR = "src";
const _STYLE_DIR = "style";


const babelOptions = {
    plugins: [
        "syntax-dynamic-import",
        "transform-runtime", // Requires two packages: babel-plugin-transform-runtime (in dev) and babel-runtime (in deps).
    ],
    presets: ["es2015", "es2016", "es2017", "react"],
    retainLines: true,
};

/**
 * @module
 * This is a webpack 4 configuration file.
 */
module.exports = {
    devtool: "source-maps",
    entry: {
        app: `./${_SOURCE_DIR}/index.ts`
    },
    mode: process.env.WEBPACK_SERVE ? "development" : "production",
    module: {
        rules: [
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
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: "babel-loader",
                        options: babelOptions
                    },
                    {
                        loader: "awesome-typescript-loader",
                        options: {
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
            },
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: "babel-loader",
                        options: babelOptions
                    }
                ]
            }
        ]
    },
    output: {
        filename: "[name].js",
        globalObject: "this", // temporary workaround for https://github.com/webpack/webpack/issues/6642
        path: path.resolve(__dirname, _OUTPUT_DIR),
        publicPath: "/"
    },
    plugins: [
        new webpack.BannerPlugin({ banner: fs.readFileSync("./LICENSE", "utf8") }),
        new HtmlWebpackPlugin({ inject: "head", template: "./src/index.template.html", title: "Acadia Island Explorer" }),
        new MiniCssExtractPlugin({ filename: "[name].css" })
    ],
    resolve: {
        alias: {
            "@action": path.resolve(__dirname, "src/app/action/"),
            "@controls": path.resolve(__dirname, "src/app/view/common/controls/"),
            "@reducer": path.resolve(__dirname, "src/app/reducer/")
        },
        extensions: [".js", "json", ".jsx", "scss", ".ts", ".tsx"]
    },
    serve: {
        content: path.resolve(__dirname, _OUTPUT_DIR),
        add: (app, middleware, options) => {
            app.use(convert(history()));
        }
    },
    target: "web"
};

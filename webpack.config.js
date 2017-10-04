"use strict";

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");
const webpack = require("webpack");


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
 * This is a webpack2 configuration file.
 */
module.exports = {
    devServer: {
        contentBase: path.resolve(__dirname, _OUTPUT_DIR),
        historyApiFallback: true,
        inline: true
    },
    devtool: "source-maps",
    entry: {
        app: `./${_SOURCE_DIR}/index.ts`
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    use: [{
                        loader: "css-loader"
                    }, {
                        loader: "sass-loader"
                    }]
                })
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
        path: path.resolve(__dirname, _OUTPUT_DIR),
        publicPath: "/"
    },
    plugins: [
        new webpack.DefinePlugin({ "process.env": { NODE_ENV: process.env.NODE_ENV } }),
        new webpack.LoaderOptionsPlugin({ debug: true }),
        new ExtractTextPlugin("app.css"),
        new HtmlWebpackPlugin({ inject: "head", template: "./src/index.template.html", title: "Acadia Island Explorer" }),
    ],
    resolve: {
        alias: {
            "@controls": path.resolve(__dirname, "src/app/view/common/controls/"),
            "@reducer": path.resolve(__dirname, "src/app/reducer/")
        },
        extensions: [".js", "json", ".jsx", "scss", ".ts", ".tsx"]
    },
    target: "web"
};

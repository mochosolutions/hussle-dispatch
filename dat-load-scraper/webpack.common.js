const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');

const API_URL = process.env.API_URL || 'http://localhost:3001';

module.exports = {
    entry: {
        popup:  path.resolve("./src/popup/index.tsx"),
        contentScript: path.resolve('src/contentScript/contentScript.ts'),
        script: path.resolve('src/contentScript/script.ts'),
        relayContentScript: path.resolve('src/contentScript/relayContentScript.ts'),
        relayScript: path.resolve('src/contentScript/relayScript.ts'),
        background: path.resolve('src/contentScript/background.ts'),
    },
    module: {
        rules: [
            {
                use: 'ts-loader',
                test: /\.(tsx|ts)$/,
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                type: 'assets/resource',
                test: /\.(png|jpg|jpeg|gif|woff|woff2|tff|eot|svg)$/,
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.js', '.ts']
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist'),
        clean: true,
        globalObject: 'this'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.API_URL': JSON.stringify(API_URL),
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve('src/static'),
                    to: path.resolve('dist')
                }
            ]
        }),
        new HtmlPlugin({
            title: 'React Extension',
            filename: `popup.html`,
            chunks: ['popup']
        })
    ],
}

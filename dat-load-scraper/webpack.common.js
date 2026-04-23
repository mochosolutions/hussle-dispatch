const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        popup:  path.resolve("./src/popup/index.tsx"),
        contentScript: path.resolve('src/contentScript/contentScript.ts'),
        script: path.resolve('src/contentScript/script.ts'),
        relayContentScript: path.resolve('src/contentScript/relayContentScript.ts'),
        relayScript: path.resolve('src/contentScript/relayScript.ts'),
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
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve('src/static'),
                    to: path.resolve('dist')
                },
                {
                    // Copy background.js directly — MV3 service workers must be plain scripts,
                    // not webpack module bundles
                    from: path.resolve('src/contentScript/background.js'),
                    to: path.resolve('dist/background.js')
                }
            ]
        }),
        new HtmlPlugin({
            title: 'React Extension',
            filename: `popup.html`,
            chunks: ['popup']
        })
        // ...getHtmlPlugins([
        //     'popup',
        //     'options',
        // ])
    ],
    // optimization: {
    //     splitChunks: {
    //         chunks: 'all',
    //     }
    // }
}

// function getHtmlPlugins(chunks){
//     return chunks.map(chunk => new HtmlPlugin({
//         title: 'React Extension',
//         filename: `${chunk}.html`,
//         chunks: [chunk]
//     }))
// }
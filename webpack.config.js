'use strict';
process.traceDeprecation = true;
const path = require('path');

module.exports = {
    target: 'web',

    entry: {
        'groot': [
            'babel-polyfill',
            path.join(__dirname, 'src', 'es5-wrapper.js'),
        ],
        'demo': [
            'babel-polyfill',
            path.join(__dirname, 'src', 'demo.js'),
        ]
    },

    externals: {},

    output: {
        path: path.join(__dirname, 'dist'),
        filename: `[name].js`,
        pathinfo: false,
    },

    resolve: {
        modules: [
            path.join(__dirname, 'src'),
            path.join(__dirname, 'node_modules'),
        ],

        extensions: ['.js', '.hbs', '.scss']
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ['es2015'],
                    cacheDirectory: true
                }
            },

            {
                test: /\.hbs$/,
                loader: 'handlebars-loader',
                options: {
                }
            },
        ],
    },

    plugins: [],

    stats: {
        colors: true
    },

    devtool: 'source-map',

    // spoof calls to node fs
    node: {
        fs: 'empty'
    },

    bail: true
};

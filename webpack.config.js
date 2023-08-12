const path = require('path');

module.exports = {
    devtool: 'eval-source-map',
    entry: './src/vue3-dragula.ts',
    output: {
        filename: 'vue3-dragula.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                include: path.resolve(__dirname, 'src'),
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
}
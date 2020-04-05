/* eslint-disable */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
	module: {
		rules: [
			{
				test: /\.js$/,
				include: path.resolve(__dirname, 'src'),
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: 'RxOfLife',
			template: path.resolve(__dirname, 'static') + '/index.html'
		})
	],
	mode: 'production'
};

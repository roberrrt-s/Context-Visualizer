/* eslint-disable no-process-env */

const Webpack               = require('webpack');
const {CleanWebpackPlugin}  = require('clean-webpack-plugin');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const MiniCssExtractPlugin  = require('mini-css-extract-plugin');
const fs                    = require('fs');
const Path                  = require('path');
const BrowserSyncPlugin     = require('browser-sync-webpack-plugin');
const packageInformation    = require('../package.json');
const UglifyJsPlugin        = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin     = require('html-webpack-plugin');

const PRODUCTION  = process.env.NODE_ENV === 'production';
const HASH_BUNDLE = PRODUCTION ? '[chunkhash:16]' : '[name]-[chunkhash:16]';
const HASH_ASSETS = PRODUCTION ? '[hash:16]' : '[name]-[hash:16]';

const ROOT = Path.join(__dirname, '..');

const babelTransforms = [
	'@babel/plugin-proposal-class-properties'
];

const babelPresets = [
	[
		'@babel/preset-env',
		{
			'targets'           : '>0.5%',
			'useBuiltIns'       : 'usage',
			'corejs'            : 3,
			// for uglify
			'forceAllTransforms': true,
			'modules'           : false
		}
	]
];

function getBuildDate() {
	const date = new Date();

	return [date.getDate(), (date.getMonth() + 1), date.getFullYear()].join('-');
}

module.exports = {
	context: Path.join(ROOT, 'src'),
	entry  : {
		'main': [
			'./styles/main.scss',
			'./scripts/global.js',
		]
	},
	target: 'web',
	output: {
		path         : Path.join(ROOT, 'dist'),
		publicPath   : PRODUCTION ? '.' : '/',
		filename     : `scripts/${HASH_BUNDLE}.js`,
		library      : '[name]',
		libraryTarget: 'umd'
	},
	optimization: {
		minimizer: [new UglifyJsPlugin({
			uglifyOptions: {
				'compress': {
					'drop_console': true
				}
			}
		})],
		splitChunks: {
			chunks: 'all'
		}
	},
	devtool  : PRODUCTION ? 'none' : 'cheap-module-eval-source-map',
	devServer: {
		contentBase: './dist'
	},
	externals: [
	],
	module: {
		rules: [
			{
				test: /\.css$/,
				use : [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader'
					}
				]
			},
			{
				test: /\.scss$/,
				use : [
					MiniCssExtractPlugin.loader,
					{
						loader : 'css-loader',
						options: {
							modules: false
						}
					},
					{
						loader : 'postcss-loader',
						options: {
							config: {
								path: Path.join(ROOT, 'build', 'postcss.config.js')
							}
						}
					},
					'sass-loader'
				]
			},
			{
				test   : /\.svg$/i,
				loader : 'file-loader',
				options: {
					name: `images/${HASH_ASSETS}.[ext]`
				}
			},
			{
				test   : /\.(jpg|png|gif|mp4|mov|webm|ogv)$/i,
				loader : 'file-loader',
				options: {
					name: `images/${HASH_ASSETS}.[ext]`
				}
			},
			{
				test   : /\.(eot|woff2?|ttf)$/i,
				loader : 'file-loader',
				options: {
					name: `fonts/${HASH_ASSETS}.[ext]`
				}
			},
			{
				test   : /\.js$/,
				exclude: [
					/node_modules/
				],
				loader : 'babel-loader',
				options: {
					presets: babelPresets,
					plugins: babelTransforms
				}
			}
		]
	},
	resolveLoader: {
		modules: [
			'node_modules',
			Path.join(ROOT, 'build')
		]
	},
	resolve: {
		modules: [
			Path.join(ROOT, 'src/scripts'),
			Path.join(ROOT, 'node_modules')
		],
		extensions: ['.js'],
		alias     : {
			'main'  : Path.resolve(ROOT, 'src/scripts/main'),
			'images': Path.resolve(ROOT, 'src/images')
		}
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: '../src/index.html'
		}),
		new Webpack.DefinePlugin({
			'PACKAGE': {
				'NAME'         : `"${packageInformation.name}"`,
				'DESCRIPTION'  : `"${packageInformation.description}"`,
				'VERSION'      : `"${packageInformation.version}"`,
				'AUTHOR'       : `"${packageInformation.author}"`,
				'CREATION_DATE': `"${new Date().getFullYear()}"`,
				'BUILD_DATE'   : `"${getBuildDate()}"`,
				'PRODUCTION'   : PRODUCTION
			}
		}),
		new BrowserSyncPlugin({
			open       : false,
			port       : 3001,
			proxy      : 'server:3000',
			reloadDelay: 2000
		}),
		new CleanWebpackPlugin({
       		cleanAfterEveryBuildPatterns: ['dist']
		}),
		new MiniCssExtractPlugin({
			filename: `styles/${HASH_BUNDLE}.css`
		}),
		new WebpackAssetsManifest({
			output     : 'assets.json',
			space      : 2,
			writeToDisk: true,
			publicPath : true,
			entrypoints: true
		})
	]
};

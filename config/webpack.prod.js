import ResourceHintWebpackPlugin from 'resource-hints-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import WorkboxPlugin from 'workbox-webpack-plugin';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import GitRevisionPlugin from 'git-revision-webpack-plugin';
import StylishPlugin from 'eslint/lib/cli-engine/formatters/stylish';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { config } from 'dotenv';

import getEnvVariables from './env.js';

const dotenv = config({
    path: '.env',
});

const gitRevisionPlugin = new GitRevisionPlugin();

const appBase = process.cwd();
const eslintFile = path.resolve(appBase, '.eslintrc-loader.js');
const appSrc = path.resolve(appBase, 'src/');
const appDist = path.resolve(appBase, 'build/');
const appIndexJs = path.resolve(appBase, 'src/index.tsx');
const appIndexHtml = path.resolve(appBase, 'public/index.html');
const appFavicon = path.resolve(appBase, 'public/favicon.ico');
const appFaviconImage = path.resolve(appBase, 'public/favicon.png');

module.exports = (env) => {
    const ENV_VARS = {
        ...dotenv.pared,
        ...getEnvVariables(env),
        REACT_APP_VERSION: JSON.stringify(gitRevisionPlugin.version()),
        REACT_APP_COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
        REACT_APP_BRANCH: JSON.stringify(gitRevisionPlugin.branch()),
    };

    return {
        entry: appIndexJs,
        output: {
            path: appDist,
            publicPath: '/',
            sourceMapFilename: 'sourcemaps/[file].map',
            chunkFilename: 'js/[name].[chunkhash].js',
            filename: 'js/[name].[contenthash].js',
        },

        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            alias: {
                'base-scss': path.resolve(appBase, 'src/stylesheets/'),
                'rs-scss': path.resolve(appBase, 'src/vendor/react-store/stylesheets/'),
            },
            symlinks: false,
        },

        mode: 'production',

        devtool: 'source-map',

        node: {
            fs: 'empty',
        },

        optimization: {
            minimizer: [
                // NOTE: Using TerserPlugin instead of UglifyJsPlugin as es6 support deprecated
                new TerserPlugin({
                    parallel: true,
                    sourceMap: true,
                    terserOptions: {
                        mangle: true,
                        compress: { typeofs: false },
                    },
                }),
                new OptimizeCssAssetsPlugin({
                    cssProcessorOptions: {
                        safe: true,
                    },
                }),
            ],
            splitChunks: {
                cacheGroups: {
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                },
            },
            runtimeChunk: 'single',
            moduleIds: 'hashed',
        },

        module: {
            rules: [
                {
                    test: /\.(js|jsx|ts|tsx)$/,
                    include: appSrc,
                    use: [
                        'babel-loader',
                        {
                            loader: 'eslint-loader',
                            options: {
                                configFile: eslintFile,
                                // NOTE: adding this because eslint 6 cannot find this
                                // https://github.com/webpack-contrib/eslint-loader/issues/271
                                formatter: StylishPlugin,
                            },
                        },
                    ],
                },
                {
                    test: /\.(html)$/,
                    use: [
                        {
                            loader: 'html-loader',
                            options: {
                                attrs: [':data-src'],
                            },
                        },
                    ],
                },
                {
                    test: /\.s?css$/,
                    include: appSrc,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: require.resolve('css-loader'),
                            options: {
                                importLoaders: 1,
                                modules: {
                                    localIdentName: '[name]_[local]_[hash:base64]',
                                },
                                localsConvention: 'camelCase',
                                sourceMap: true,
                            },
                        },
                        {
                            loader: require.resolve('sass-loader'),
                            options: {
                                sourceMap: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: 'assets/[hash].[ext]',
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': ENV_VARS,
            }),
            new CircularDependencyPlugin({
                exclude: /node_modules/,
                failOnError: false,
                allowAsyncCycles: false,
                cwd: appBase,
            }),
            // Remove build folder anyway
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: appIndexHtml,
                filename: './index.html',
                title: 'POSM replay tool',
                favicon: path.resolve(appFavicon),
                chunksSortMode: 'none',
            }),
            new MiniCssExtractPlugin({
                filename: 'css/[name].css',
                chunkFilename: 'css/[id].css',
            }),
            new WorkboxPlugin.GenerateSW({
                // these options encourage the ServiceWorkers to get in there fast
                // and not allow any straggling "old" SWs to hang around
                clientsClaim: true,
                skipWaiting: true,
                include: [/\.html$/, /\.js$/, /\.css$/],
                navigateFallback: '/index.html',
                navigateFallbackBlacklist: [/^\/assets/, /^\/admin/, /^\/api/],
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        urlPattern: /assets/,
                        handler: 'cacheFirst',
                    },
                ],
            }),
            new WebpackPwaManifest({
                name: 'posm-replay-tool',
                short_name: 'POSM replay tool',
                description: 'Replay changes to OSM',
                background_color: '#ffffff',
                orientation: 'portrait',
                theme_color: '#394B59',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: path.resolve(appFaviconImage),
                        sizes: [96, 128, 192, 256, 384, 512],
                        destination: path.join('assets', 'icons'),
                    },
                ],
            }),
            new CompressionPlugin(),
            new ResourceHintWebpackPlugin(),
            new webpack.HashedModuleIdsPlugin(),
        ],
    };
};

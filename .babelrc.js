module.exports = (api) => {
    return {
        'env': {
            'test': {
                'plugins': [
                    'babel-plugin-dynamic-import-node',
                ],
            },
        },
        'presets': [
            '@babel/preset-typescript',
            '@babel/preset-react',
            api.env('development')
                ? '@babel/preset-env'
                : ['@babel/preset-env', {
                    'useBuiltIns': "usage",
                    'corejs': 3,
                    'debug': true,
                }],
        ],

        'plugins': [
            // Reuse babel's injected headers
            ['@babel/plugin-transform-runtime', {
                'corejs': 3,
                'regenerator': true,
            }],

            // Stage 2
            ['@babel/plugin-proposal-decorators', { 'legacy': true }],
            '@babel/plugin-proposal-function-sent',
            '@babel/plugin-proposal-export-namespace-from',
            '@babel/plugin-proposal-numeric-separator',
            '@babel/plugin-proposal-throw-expressions',

            // Stage 3
            '@babel/plugin-syntax-dynamic-import',
            '@babel/plugin-syntax-import-meta',
            ['@babel/plugin-proposal-class-properties', { 'loose': false }],
            '@babel/plugin-proposal-json-strings',

            [
                'module-resolver',
                {
                    'root': ['.'],
                    'extensions': ['.js', '.jsx', '.ts', '.tsx'],
                    'alias': {
                        '#components': './src/components',
                        '#config': './src/config',
                        '#constants': './src/constants',
                        '#notify': './src/notify',
                        '#actionCreators': './src/store/actionCreators',
                        '#selectors': './src/store/selectors',
                        '#request': './src/request',
                        '#resources': './src/resources',
                        '#schema': './src/schema',
                        '#store': './src/store',
                        '#ts': './src/ts',
                        '#utils': './src/utils',
                        '#rsca': './src/vendor/react-store/components/Action',
                        '#rscg': './src/vendor/react-store/components/General',
                        '#rsci': './src/vendor/react-store/components/Input',
                        '#rscv': './src/vendor/react-store/components/View',
                        '#rscz': './src/vendor/react-store/components/Visualization',
                        '#rsk': './src/vendor/react-store/constants',
                        '#rsu': './src/vendor/react-store/utils',
                        '#views': './src/views',
                    },
                },
            ],
        ],
    };
};

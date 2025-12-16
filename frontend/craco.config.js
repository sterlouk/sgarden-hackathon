module.exports = {
	webpack: {
		configure: {
			ignoreWarnings: [
				/Failed to parse source map/,
				{ module: /power-assert/ },
			],
			resolve: {
				fallback: {
					url: require.resolve("url"),
				},
			},
		},
	},
	eslint: {
		enable: false,
	},
	devServer: {
		port: 3002,
	},
};

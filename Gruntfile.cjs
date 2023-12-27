// https://github.com/vojtajina/grunt-bump

module.exports = function (grunt) {
	grunt.initConfig({
		bump: {
			options: {
				files: ['package.json'],
				updateConfigs: [],
				commit: true,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['-a'],
				createTag: true,
				tagName: 'v%VERSION%',
				tagMessage: 'Version %VERSION%',
				push: true,
				pushTo: 'https://github.com/Bracketed/SwiftCDN',
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
				globalReplace: false,
				prereleaseName: 'dev0',
				metadata: '',
				regExp: false,
			},
		},
	});

	grunt.loadNpmTasks('grunt-bump');
};

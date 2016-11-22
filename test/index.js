var os = require('os'),
	fs = require('fs'),
	path = require('path'),
	assert = require('assert'),
	swintHelper = require('swint-helper'),
	buildPolymer = require('../lib');

global.swintVar.printLevel = 5;

describe('builder-polymer', function() {
	it('Error when no callback', function() {
		assert.throws(function() {
			buildPolymer({});
		});
	});

	it('Error when inDir doesn\'t exist', function(done) {
		buildPolymer({
			inDir: '/this-directory-does-not-exist'
		}, function(err, res) {
			assert.notEqual(err, null);
			done();
		});
	});

	it('Simple case', function(done) {
		buildPolymer({
			name: 'Test',
			inDir: path.join(__dirname, '../test_case/target'),
			outDir: path.join(os.tmpdir(), 'swint-builder-polymer-out'),
			lint: {
				check: false
			},
			png: {
				enable: true,
				metaDir: path.join(__dirname, '../test_case/pngMeta')
			},
			svg: {
				enable: true,
				dir: path.join(__dirname, '../test_case/svg')
			},
			variables: {
				tmplVar: 'A'
			}
		}, function(err, res) {
			assert.deepEqual(
				fs.readFileSync(path.join(__dirname, '../test_result/Test.html'), 'utf-8'),
				fs.readFileSync(path.join(os.tmpdir(), 'swint-builder-polymer-out/Test.html'), 'utf-8')
			);

			done();
		});
	});

	it('Lint', function(done) {
		buildPolymer({
			name: 'Test',
			inDir: path.join(__dirname, '../test_case/target'),
			imgMetaDir: path.join(__dirname, '../test_case/imgMeta'),
			outDir: path.join(os.tmpdir(), 'swint-builder-polymer-out'),
			lint: {
				options: {
					configFile: path.join(__dirname, '../test_case/.eslintrc'),
					ignorePath: path.join(__dirname, '../test_case/.eslintignore')
				},
				dir: path.join(__dirname, '../test_case')
			},
			variables: {
				tmplVar: 'A'
			}
		}, function(err, res) {
			assert.equal(res.errorCount, 1);

			done();
		});
	});

	after(function() {
		fs.unlinkSync(path.join(os.tmpdir(), 'swint-builder-polymer-out/Test.html'));
		fs.rmdirSync(path.join(os.tmpdir(), 'swint-builder-polymer-out'));
	});
});

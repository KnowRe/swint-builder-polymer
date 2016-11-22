'use strict';

var path = require('path'),
	fs = require('fs'),
	ejs = require('ejs'),
	async = require('async'),
	sprintf = require('sprintf').sprintf,
	eslint = require('eslint').CLIEngine,
	minify = require('html-minifier').minify,
	vulcanize = require('vulcanize'),
	swintHelper = require('swint-helper'),
	defaultize = swintHelper.defaultize,
	walk = swintHelper.walk;

module.exports = function(options, callback) {
	defaultize({
		name: 'Project',
		inDir: path.dirname(require.main.filename),
		outDir: path.join(path.dirname(require.main.filename), '../out'),
		png: {
			enable: false,
			metaDir: path.join(path.dirname(require.main.filename), '../pngMeta'),
			varName: 'png'
		},
		svg: {
			enable: false,
			dir: path.join(path.dirname(require.main.filename), '../svg'),
			varName: 'svg'
		},
		lint: {
			check: true,
			options: {
				extensions: ['.js', '.html']
			}
		},
		removeIDAttr: true,
		variables: {}
	}, options);

	return proceed(options, callback);
};

var proceed = function(options, callback) {
	if (callback === undefined) {
		var msg = 'swint-builder-polymer function needs callback';
		print(4, msg);
		throw new Error(msg);
	}

	if (!fs.existsSync(options.inDir)) {
		callback('swint-builder-polymer: inDir doesn\'t exist', false);
		return;
	}

	if (!fs.existsSync(options.outDir)) {
		fs.mkdirSync(options.outDir);
	}

	if (options.lint.check) {
		var engine = new eslint(options.lint.options),
			report = engine.executeOnFiles([path.relative(process.cwd(), options.lint.dir)]);

		if (report.errorCount || report.warningCount) {
			print(4, (eslint.getFormatter())(report.results));
			callback('Lint error', report);
			return;
		}
	}

	if (options.svg.enable) {
		var svgList = walk({
				dir: options.svg.dir,
				ext: 'svg'
			}),
			svgData = {};

		svgList.forEach(function(s) {
			var thePath = (s.replace(options.svg.dir, '')).split(path.sep).splice(1),
				objNow = svgData;

			for (var i = 0; i < thePath.length - 1; i++) {
				if (!objNow.hasOwnProperty(thePath[i])) {
					objNow[thePath[i]] = {};
				}
				objNow = objNow[thePath[i]];
			}
			objNow[thePath[thePath.length - 1].replace('.svg', '')] = 'data:image/svg+xml;base64,' + fs.readFileSync(s).toString('base64');
		});

		options.variables[options.svg.varName] = svgData;
	}

	var fileList = walk({
			dir: options.inDir,
			ext: 'html'
		}),
		outFiles = [];

	async.parallel(
		fileList.map(function(f) {
			return function(cb) {
				var vulcan = new vulcanize({
					inlineScripts: true,
					inlineCss: true
				});

				vulcan.process(f, function(err, html) {
					if (err) {
						cb(err, false);
						return;
					}

					var outFile = path.join(options.outDir, path.basename(f));

					outFiles.push(outFile);
					
					fs.writeFileSync(outFile, html, 'utf-8');
					cb(null, true);
				});
			};
		}),
		function(err) {
			if (err) {
				print(4, err);
				return;
			}
			_proceedImgMeta(options, outFiles, callback);
		}
	);
};

var _proceedImgMeta = function(options, outFiles, callback) {
	if (options.png.enable) {
		var imgMetaDir = walk({
				dir: options.png.metaDir,
				ext: 'json'
			}),
			imgMeta = imgMetaDir.map(function(v) {
				return JSON.parse(fs.readFileSync(v, 'utf8'));
			}),
			imgMetaVar = {};

		imgMetaDir.forEach(function(v, idx) {
			var bn = path.basename(v).replace('.meta.json', '');

			imgMetaVar[bn] = {};
			imgMeta[idx].forEach(function(vv) {
				var fn = vv.name.replace('.png', '');

				imgMetaVar[bn][fn] = sprintf(
					'background-image: url(\'img/%s.png\');\n' +
					'\tbackground-position: -%dpx 0;\n' +
					'\twidth: %dpx;\n' +
					'\theight: %dpx;',
					bn,
					vv.offset,
					vv.width,
					vv.height
				);
			});
		});

		options.variables[options.png.varName] = imgMetaVar;
	}

	_proceedHTML(options, outFiles, callback);
};

var _proceedHTML = function(options, outFiles, callback) {
	outFiles.forEach(function(f) {
		var outputRaw = fs.readFileSync(f, 'utf8');

		outputRaw = ejs.render(
			outputRaw,
			options.variables
		);
		outputRaw = outputRaw.replace(/img source/g, 'img src');
		outputRaw = outputRaw.replace(/urlAbs\(/g, 'url(');
		if (options.removeIDAttr) {
			outputRaw = outputRaw.replace(/<((?!(dom-module))[a-zA-Z0-9-]+)([^><]+)id=\"[^\s]+\"/g, '<$1$2$3');
		}
		outputRaw = minify(outputRaw, {
			customAttrAssign: [/\$=/],
			collapseWhitespace: true,
			minifyJS: true,
			minifyCSS: false
		});

		fs.writeFileSync(f, outputRaw, 'utf8');
	});

	if (callback !== undefined) {
		callback(null, true);
	}
};

# swint-builder-polymer
Polymer web copmonent builder for Swint

**Warning: This is not the final draft yet, so do not use this until its official version is launched**

## Installation
```sh
$ npm install --save swint-builder-polymer
```

## Options
* `name` : `String`, default: `Project`
* `inDir` : `String`, default: `path.dirname(require.main.filename)`
* `imgMetaDir` : `String`, default: `path.join(path.dirname(require.main.filename), '../imgMeta')`
* `outDir` : `String`, default: `path.join(path.dirname(require.main.filename), '../out')`
* `variables` : `Object`, default: `{}`

## Usage
```javascript
buildPolymer({
	name: 'Test',
	inDir: path.join(__dirname, 'elements', 'target'),
	imgMetaDir: path.join(__dirname, 'imgMeta'),
	outDir: path.join(__dirname, 'out'),
	variables: {}
}, function() {
	// Build complete
});
```

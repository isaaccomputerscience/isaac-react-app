'use strict';

const path = require('path');

module.exports = {
  process(sourceText, sourcePath, options) {
    const assetFilename = JSON.stringify(path.basename(sourcePath));

    if (sourcePath.match(/\.svg$/)) {
      return {
        code: `const React = require('react');
        module.exports = {
          __esModule: true,
          default: ${assetFilename},
          ReactComponent: React.forwardRef((props, ref) => ({
            $$typeof: Symbol.for('react.element'),
            type: 'svg',
            ref: ref,
            key: null,
            props: Object.assign({}, props, {
              children: ${assetFilename}
            })
          })),
        };`,
      };
    }

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};

# @petrichorjs/config

All the common config files for petrichor js.

## Setup

How to set up the config.

1. Install dependacies.

```shell
$ npm i -D typescript prettier prettier-plugin-jsdoc eslint @eslint/js @types/eslint__js  typescript-eslint
```

2. Prettier

```js
// .prettierrc.js
//@ts-check

import base from "@petrichorjs/config/prettier";

/**
 * @type {import("prettier").Config}
 * @see https://prettier.io/docs/en/configuration.html
 */
const config = {
    ...base,
};

export default config;
```

2. Eslint

```js
// eslint.config.mjs
// @ts-check

import base from "@petrichorjs/config/eslint";

export default [...base];
```

3. Tsconfig

```json
// tsconfig.json
{
    "extends": "@petrichorjs/config/tsconfig",
    "compilerOptions": {
        "rootDir": "./src",
        "outDir": "./dist"
    }
}
```


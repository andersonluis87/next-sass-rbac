# How to get Biome to behave in a monorepo

At the time of writing, namely v1.8.3, Biome [does not fully support](https://biomejs.dev/guides/big-projects/#monorepos) monorepos yet, but you can wrestle it into working.

Below, we have a typical monorepo (with the changes we're about to make marked in green). It has some workspaces under `apps` and `packages`, and at each level of the repo, there are a mixture of files we want to format or ignore.

```diff
  .
  ├── .gitignore
+ ├── .vscode
+ │   ├── extensions.json
+ │   └── settings.json
  ├── README.md
  ├── apps
  │   └── my-app
  │       ├── .gitignore
  │       ├── dist
+ │       ├── biome.jsonc
  │       ├── index.js
  │       └── package.json
+ ├── biome.jsonc
+ ├── biome.root.jsonc
  ├── package.json
  ├── packages
  │   ├── my-package
  │   │   ├── .gitignore
  │   │   ├── dist
+ │   │   ├── biome.jsonc
  │   │   ├── index.js
  │   │   └── package.json
+ │   └── biome-config
+ │       ├── biome.jsonc
+ │       └── package.json
  └── pnpm-lock.yaml
```

We don't want to leave any file behind. We want to be able to:

- Format the root-level `package.json` (and `README.md`, once supported) via CLI and "format on save".
- Format all the `biome.jsonc` files themselves.
- Avoid formatting any files mentioned in `.gitignore`, both via CLI and "format on save".
- Avoid formatting the `pnpm-lock.yaml` file (once supported), both via CLI and "format on save", which is not gitignored.

## VS Code setup

This is needed to support "format on save".

### .vscode/extensions.json

Recommend the official VS Code extension.

```json
{
  "recommendations": ["biomejs.biome"]
}
```

### .vscode/settings.json

- I disable Prettier here explicitly just in case the VS Code Prettier extension tries to get its hands on the project. Not totally sure whether it's necessary, though.
- I set the Biome extension as the default formatter. Take care that if you've set Prettier as your default formatter for a certain file type in your user settings, that'll override this workspace setting for that file type.

```json
{
  "prettier.enable": false,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  }
}
```


## The base config

We begin by writing our base config. I've only added a couple of things to the default config.

### packages/biome-config/biome.jsonc

```diff
  {
    "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
    "organizeImports": {
      "enabled": true
    },
+   "json": {
+     "parser": {
+       // Supports files like tsconfig.json and .vscode/settings.json that
+       // support comments, despite their file extension.
+       "allowComments": true
+     }
+   },
+   // Ignore files matched by .gitignore.
+   "vcs": {
+     "enabled": true,
+     "clientKind": "git",
+     "useIgnoreFile": true
+   },
    "linter": {
      "enabled": true,
      "rules": {
        "recommended": true
      }
    }
  }
```

### packages/biome-config/package.json

This mostly just follows the Biome [instructions](https://biomejs.dev/guides/how-biome-works/#extend-biomejson-from-a-library) on how to distribute a Biome config as a library. It's really just the `"type": "module"` and `"exports"` bit.

To allow this package to check itself, though, I've added `@biomejs/biome` as a dependency and a couple of npm scripts for convenience. Yes, we could remove those and format it all from the root level instead, but I like to structure packages in a monorepo in a way that would allow them to be extracted out of the monorepo in future and still work standalone.

```json
{
  "name": "@my-org/my-biome-config",
  "type": "module",
  "version": "1.0.0",
  "description": "Monorepo-wide Biome configuration",
  "exports": {
    "./biome": "./biome.jsonc"
  },
  "scripts": {
    "format": "biome format",
    "lint": "biome lint"
  },
  "devDependencies": {
    "@biomejs/biome": "1.8.3"
  }
}
```

## Setting up our workspaces

### apps

Here's a reminder of the structure:

```diff
  my-app
  ├── .gitignore
  ├── dist
+ ├── biome.jsonc
  ├── index.js
  └── package.json
```

And note that our `.gitignore` ignores the `dist` folder:

```
dist
```

#### apps/my-app/biome.jsonc

Here, we extend our base config.

- Although `$schema` was declared in the base config, you'll find better editor support (e.g. mouseover hints) if you add it, so it's evidently not inferred.
- Although Biome implemented [node module resolution](https://biomejs.dev/guides/how-biome-works/#extend-biomejson-from-a-library) in v1.6.0, it still doesn't resolve symlinks, so if you're using a package manager like pnpm, you'll have to prepend "./node_modules" to help it resolve the config.
- There's no need to explicitly ignore "dist", because it's ignored in our `.gitignore` file.
- Beware that only the `.gitignore` file adjacent to the Biome config file will be respected. Biome **doesn't implement gitignore inheritance** [yet](https://github.com/biomejs/biome/issues/2312).

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  // We prepend "./node_modules" because Biome doesn't resolve pnpm's symlinks
  "extends": ["./node_modules/@my-org/biome-config/biome.jsonc"]
}
```

### packages

ℹ️ This package is structured identically to `my-app` above, so this is just a repeat of the instructions from before. But, for completion's sake, we'll cover it anyway.

Here's a reminder of the structure:

```diff
  my-package
  ├── .gitignore
  ├── dist
+ ├── biome.jsonc
  ├── index.js
  └── package.json
```

And note that our `.gitignore` ignores the `dist` folder:

```
dist
```

#### packages/my-package/biome.jsonc

Exactly the same as before.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  // We prepend "./node_modules" because Biome doesn't resolve pnpm's symlinks
  "extends": ["./node_modules/@my-org/biome-config/biome.jsonc"]
}
```

## Setting up the root

Here, our aim is to support formatting root-level files like `package.json` via both CLI and "save on format".

The Biome VS Code Extension will look only for the root-level biome config file; it annoyingly doesn't implement any inheritance. Thus, it will:

- **respect** the **root-level** config.
- **disregard** any **workspace-level** config.

### biome.jsonc

Pretty similar to the configs above, but with one key difference. We sadly have to **manually duplicate all the ignore rules** from each other workspace that contains its own Biome config to work around the lack of inheritance.

If you want to have different linting/formatting rules for each workspace, it's possible via CLI but not for "format on save". For "format on save", all you get is this one config that doesn't support any inheritance.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  // We prepend "./node_modules" because Biome doesn't resolve pnpm's symlinks
  "extends": ["./node_modules/@my-org/biome-config/biome.jsonc"],
  "files": {
    // Duplicate all the ignore rules from nested Biome configs.
    "ignore": [
      /* Root */
      "pnpm-lock.yaml",

      /* apps/my-app */
      "apps/my-app/dist"

      /* my-package/my-app */
      "packages/my-package/dist"
    ]
  }
}
```

### biome.root.jsonc

We want a config to allow us, with the CLI, to check root-level files like `package.json` without checking the whole monorepo. By naming it `biome.root.json`, it won't be noticed by the VS Code extension, so it won't affect "format on save".

- Surprisingly, pnpm-lock.yaml is [not listed](https://biomejs.dev/guides/how-biome-works/#protected-files) as a default ignored file.

```json
// Config (for CLI use only) to check root-level files.
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  // We prepend "./node_modules" because Biome doesn't resolve pnpm's symlinks
  "extends": ["./node_modules/@my-org/biome-config/biome.jsonc"],
  "files": {
    "ignore": [
      // Ignore any workspaces that are covered by their own Biome config.
      "apps",
      "packages",

      "pnpm-lock.yaml"
    ]
  }
}
```

### package.json

Here we provide scripts both to lint/format our workspaces and the root project itself (which allows us to format the root-level `package.json`).

```diff
  {
    "private": true,
    "name": "@my-org/monorepo",
    "scripts": {
+     "lint": "pnpm --recursive --if-present lint",
+     "lint:self": "biome lint",
+     "format": "pnpm --recursive --if-present format",
+     "format:self": "biome format --config-path=biome.root.jsonc"
    },
+   "devDependencies": {
+     "@biomejs/biome": "1.8.3",
+     "@my-org/biome-config": "workspace:*"
+   },
    "packageManager": "pnpm@9.5.0"
  }
```

## Conclusion

The main cursed things we had to do were at the root level, namely duplicating ignore rules and having to split out our CLI config from our "format on save" config. But the upside is tremendous: We can confidently open any file anywhere in our repo, save it, and be sure that it'll get formatted only if it's meant to be formatted.

If this all sounds offputting, be aware that some of these monorepo issues (like inheritance of ignore rules) *do* also exist in Prettier, at the time of writing: [[1]](https://github.com/prettier/prettier/issues/4081) [[2]](https://github.com/prettier/prettier/pull/6203). I'm sure they'll be ironed out eventually!
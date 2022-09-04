# Contributing Guide

## System requirements

- [esbuild Problem Matchers](https://marketplace.visualstudio.com/items?itemName=connor4312.esbuild-problem-matchers)

## Overview

This extension has two main parts:

- Language Client: `src/client.ts`, `dist/client.js`
- Language Server: `src/server.ts`, `dist/server.js`

Language Client is a normal VS Code extension. Language Server, on the other hand, is a language analysis tool running in a separate process.

The server can communicate with the client following the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/).

The client sends requests to the server to request information related to such as autocompletion or hover at a given text document position, and the server returns the requested information.

The server is started by the the client.

Read the official documentation for the [Language Server Extension](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) for more details.

## Running and Debugging

- Run `npm install` in this folder.
- Open VS Code on this folder.
- Open the **Run and Debug** view by selecting the **Run and Debug** icon in the sidebar (or `⇧⌘D`).
- Select `Launch Client` from the drop down.
- Press ▷ to run the launch config.
  - `npm run watch` runs automatically.
- The new VS Code window will launch.
  - The `client.js` will be executed in this window and the extension becomes available
  - Open or create a CSS file on the window and check the behavior of the extension.
  - Debug the `client.ts` file with VS Code's built-in debugger.

### Debugging Server

Since the server runs in a separate process, we need to attach a debugger to the running server. To do so, use the launch configuration `Attach to Server`. We can debug the `server.ts` as well as the `client.ts` file.

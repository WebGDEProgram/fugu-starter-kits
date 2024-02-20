# `@fugu-angular/file-handling`

This is a [schematic](https://angular.io/guide/schematics) for adding
[File Handling](https://developer.chrome.com/docs/capabilities/web-apis/file-handling) support to an Angular PWA project. Run the
schematic with the [Angular CLI](https://angular.io/cli):

```shell
ng add @fugu-angular/file-handling --project <project-name>
```

Executing the command mentioned above will perform the following actions:

1. Adds required dependencies to your project.
1. Adds the `file_handling` property to the [manifest.webmanifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) file. If you do not have a manifest, run `ng add @angular/pwa` first.
1. Adds the necessary media types and file extensions to the manifest.
1. Provides a `LaunchQueue` service for responding to app launches.

See [Let installed web applications be file handlers](https://developer.chrome.com/docs/capabilities/web-apis/file-handling)
for more information.

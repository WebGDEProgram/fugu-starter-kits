import { chain, Rule, SchematicContext, SchematicsException } from '@angular-devkit/schematics';
import { addDependency, DependencyType, readWorkspace } from '@schematics/angular/utility';
import { lookup } from 'mime-types';
import { posix } from 'path';
import { Manifest } from './manifest';
import { Schema as FileHandlingOptions } from './schema';

function getAcceptMap(extensions: string, acceptMap: Record<string, string[]>, context: SchematicContext): Record<string, string[]> {
  normalizeExtensions(extensions).forEach((extension) => {
    let mediaType = lookup(extension);

    if (!mediaType) {
      mediaType = `application/x${extension}`.toLowerCase();
      context.logger.warn(`No officially registered media type found for extension: ${extension}.`);
      context.logger.warn(`An unregistered media type was added: ${mediaType}.`);
      context.logger.warn(`Please adjust the media type in case there is an official one, or register your extension.`);
    }

    if (acceptMap[mediaType]) {
      if (!acceptMap[mediaType].includes(extension)) {
        acceptMap[mediaType].push(extension);
      }
    } else {
      acceptMap[mediaType] = [extension];
    }
  });

  return acceptMap;
}

function normalizeExtensions(extensionsInput: string): string[] {
  if (extensionsInput.trim() === '') {
    return [];
  }

  return extensionsInput
    .split(',')
    .map(ext => ext.trim().toLowerCase())
    .map(ext => ext.startsWith('.') ? ext : `.${ext}`);
}

function overwriteManifest(path: string, manifest: Manifest): Rule {
  return (host) => host.overwrite(path, JSON.stringify(manifest, null, 2));
}

export default function(options: FileHandlingOptions): Rule {
  return async (host, context) => {
    // Resolve project in workspace
    const workspace = await readWorkspace(host);

    if (!options.project) {
      throw new SchematicsException('Option "project" is required.');
    }

    const project = workspace.projects.get(options.project);
    if (!project) {
      throw new SchematicsException('Project is not defined in this workspace.');
    }

    // Find web application manifest
    const projectSourcePath = project.sourceRoot ?? posix.join(project.root, 'src');
    const manifestPath = posix.join(projectSourcePath, options.manifestPath ?? 'manifest.webmanifest');

    if (!host.exists(manifestPath)) {
      throw new SchematicsException('Project does not contain a manifest.webmanifest file in its source root. Run "ng add @angular/pwa" to add PWA support.');
    }

    const manifest = host.readJson(manifestPath) as Manifest;
    const extensions = options.extensions ?? '';

    // Add or update file handlers
    if (Array.isArray(manifest.file_handlers)) {
      // File handlers already exist, extend first handler
      context.logger.warn('A web application manifest with a "file_handlers" already exists.');
      context.logger.warn('The file extension(s) will be added to the accept object of the first file handler.');
      const [firstFileHandler] = manifest.file_handlers;
      firstFileHandler.accept = getAcceptMap(extensions, firstFileHandler.accept, context);
    } else {
      // File handlers do not exist, create property
      manifest.file_handlers = [{
        action: '.',
        accept: getAcceptMap(extensions, {}, context)
      }];
    }

    return chain([
      // Install WICG typings for LaunchParams service
      addDependency('@types/wicg-web-app-launch', '^2023.1.3', { type: DependencyType.Dev }),
      // Update manifest
      overwriteManifest(manifestPath, manifest)
    ]);
  };
}

import { chain, Rule, SchematicsException } from '@angular-devkit/schematics';
import { addDependency, DependencyType, readWorkspace } from '@schematics/angular/utility';
import { lookup } from 'mime-types';
import { posix } from 'path';
import { Manifest } from './manifest';
import { Schema as FileHandlingOptions } from './schema';

function getAcceptMap(extensions: string, acceptMap: Record<string, string[]> = {}): Record<string, string[]> {
  normalizeExtensions(extensions).forEach((extension) => {
    const mediaType = lookup(extension);

    if (!mediaType) {
      throw new SchematicsException(`Media type not found for extension: ${extension}`);
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
    const manifestPath = posix.join(projectSourcePath, 'manifest.webmanifest');

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
      firstFileHandler.accept = getAcceptMap(extensions, firstFileHandler.accept);
    } else {
      // File handlers do not exist, create property
      manifest.file_handlers = [{
        action: '.',
        accept: getAcceptMap(extensions)
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

import { chain, Rule, SchematicsException } from '@angular-devkit/schematics';
import { addDependency, DependencyType, readWorkspace } from '@schematics/angular/utility';
import { posix } from 'path';
import { Schema as FileHandlingOptions } from './schema';

function addFileHandlersToWebApplicationManifest(manifestPath: string): Rule {
  return (host) => {
    const manifest = host.readJson(manifestPath) as { file_handlers?: unknown[] };
    manifest.file_handlers = [];
    host.overwrite(manifestPath, JSON.stringify(manifest, null, 2));
  };
}

export default function(options: FileHandlingOptions): Rule {
  return async (host) => {
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

    // TODO: Read WICG version from package.json
    // TODO: Let user specify file extensions to add

    return chain([
      addDependency('@types/wicg-web-app-launch', 'latest', {type: DependencyType.Dev}),
      addFileHandlersToWebApplicationManifest(manifestPath),
    ]);
  };
}

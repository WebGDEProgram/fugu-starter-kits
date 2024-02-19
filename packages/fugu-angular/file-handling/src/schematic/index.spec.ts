/**
 * @jest-environment node
 */

import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { posix } from 'path';
import { Schema as FileHandlingOptions } from './schema';

describe('File Handling Schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@fugu-angular/file-handling',
    posix.join(__dirname, '../collection.json')
  );
  const defaultOptions: FileHandlingOptions = {
    project: 'bar'
  };

  let appTree: UnitTestTree;

  const workspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '6.0.0'
  };

  const appOptions = {
    name: 'bar',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: 'css',
    skipTests: false
  };

  beforeEach(async () => {
    appTree = await schematicRunner.runExternalSchematic(
      '@schematics/angular',
      'workspace',
      workspaceOptions
    );
    appTree = await schematicRunner.runExternalSchematic(
      '@schematics/angular',
      'application',
      appOptions,
      appTree
    );

    // Using @angular/pwa is not possible due to an ESM import within the schematic
    appTree.create('/projects/bar/src/manifest.webmanifest', '{}');
  });

  it('should install wicg-web-app-launch types', async () => {
    const tree = await schematicRunner.runSchematic('ng-add', defaultOptions, appTree);

    const packageJson = tree.readJson('/package.json') as { devDependencies: { "@types/wicg-web-app-launch": "latest" } };

    expect(packageJson.devDependencies['@types/wicg-web-app-launch']).toBe('latest');
  });

  it('should add the "file_handling" property to the manifest', async () => {
    const tree = await schematicRunner.runSchematic('ng-add', defaultOptions, appTree);

    const manifest = tree.readJson('/projects/bar/src/manifest.webmanifest') as { file_handlers: unknown[] };

    console.log(manifest);
    expect(manifest.file_handlers).toEqual([]);
  });
});

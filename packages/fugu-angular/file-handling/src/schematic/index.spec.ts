/**
 * @jest-environment node
 */

import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { posix } from 'path';
import { Manifest } from './manifest';
import { Schema as FileHandlingOptions } from './schema';

const MANIFEST_LOCATION = '/projects/bar/src/manifest.webmanifest';

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
    appTree.create(MANIFEST_LOCATION, '{}');
  });

  it('should install wicg-web-app-launch types', async () => {
    const tree = await schematicRunner.runSchematic('ng-add', defaultOptions, appTree);

    const packageJson = tree.readJson('/package.json') as {
      devDependencies: { '@types/wicg-web-app-launch': string }
    };

    expect(packageJson.devDependencies['@types/wicg-web-app-launch']).toBe('^2023.1.3');
  });

  it('should add the "file_handling" property to the manifest without extensions', async () => {
    const tree = await schematicRunner.runSchematic('ng-add', defaultOptions, appTree);

    const manifest = tree.readJson(MANIFEST_LOCATION) as Manifest;
    expect(manifest.file_handlers).toEqual([{
      action: '.',
      accept: {}
    }]);
  });

  it('should add the "file_handling" property to the manifest with extensions', async () => {
    const tree = await schematicRunner.runSchematic('ng-add', { ...defaultOptions, extensions: '.png,.jpeg' }, appTree);

    const manifest = tree.readJson(MANIFEST_LOCATION) as Manifest;
    expect(manifest.file_handlers).toEqual([{
      action: '.',
      accept: {
        'image/png': ['.png'],
        'image/jpeg': ['.jpeg']
      }
    }]);
  });

  it('should extend the "file_handling" property to the manifest with extensions', async () => {
    const existingManifest = {
      file_handlers: [{
        action: '.',
        accept: { 'foo': ['.bar'] }
      }]
    };
    appTree.overwrite(MANIFEST_LOCATION, JSON.stringify(existingManifest));

    const tree = await schematicRunner.runSchematic('ng-add', { ...defaultOptions, extensions: '.png,.jpeg' }, appTree);

    const manifest = tree.readJson(MANIFEST_LOCATION) as Manifest;
    expect(manifest.file_handlers).toEqual([{
      action: '.',
      accept: {
        'foo': ['.bar'],
        'image/png': ['.png'],
        'image/jpeg': ['.jpeg']
      }
    }]);
  });
});

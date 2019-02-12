import {
  DependenciesListModel,
  ContentManifest
} from './../../../shared/models/global';
import log from '../../../shared/logger';
import { getDirectories, getContentFiles } from '../util/fs';
import { getListProyects } from '../util/get-order-dependencies';
import { findDependency } from '../util/find-dependencies';
import { executeCommands } from '../util/execute-commands';

// variable que indica donde se encuentan los archivos a emplear
let directory: string = '';
// variable que posee el comando que se va a ejecutar actualmente
let commands: string = '';
// variable que posee la lista de dependencias ordenadas por nivel
let dependenciesList: Array<DependenciesListModel> = [];
// variable que posee la información  de los manifest.json
let manifests: Array<ContentManifest> = [];
// variable que indica si se debe organizar el orden de las dependencias de mayor relevancia a menor
let orderList: boolean = false;

// 1. Método inicial que se encarga de buscar las carpetas dentro del directorio indicado.
export default async (command: string, all: string) => {
  // indico cual comando se va a ejecutar y cual directorio se va a emplear
  commands = `vtex ${command}`;
  directory = process.cwd() + '/';
  orderList = true;

  log.debug(`Order dependencies list ${orderList}`);
  log.debug(`Command to run: ${commands}`);
  log.debug(`Directory to use: ${directory}`);

  if (commands && directory) {
    // Realizo la busqueda en el directorio actual
    searchProjectCurrentDirectory(all);
  } else {
    log.error(`No commands specified to run`);
  }
};

// Método que se encarga de buscar un proyecto en el directorio actual
export const searchProjectCurrentDirectory = async (all: string) => {
  log.info('Use the current location for search one project');
  let response = await findProjectContnet([directory], all);
  if (!response) {
    // obtengo todos los nombres de las carpetas dentro del directorio indicado
    let files: Array<string> = await getDirectories(directory);

    if (files.length) {
      findProjectContnet(files, all);
    } else {
      log.warn(`No projects found in ${directory}`);
    }
  }
};

export const findProjectContnet = async (files: Array<string>, all: string) => {
  // si hay directorios, paso a buscar el archivo manifest.json y obtener su contenido
  manifests = await getContentFiles(files);

  // Obtengo el orden en que se van a compilar las dependencias
  dependenciesList = await getListProyects(manifests);

  // Luego de finalizar la busqueda de dependencias, paso a ejecutar los comandos por medio de consola
  if (dependenciesList.length) {
    // cambio el orden a asc, esto permitira ejecutar primero los componentes que son dependencias
    if (orderList) {
      dependenciesList.reverse();
    }

    // busco la dependencia en el manifest y paso toda su información de manifest
    log.info(`You have ${dependenciesList.length} dependencies to link`);

    let dependenciesToUse = dependenciesList;

    if (!all) {
      dependenciesToUse = await findDependency(dependenciesList);
    }

    if (dependenciesToUse.length) {
      let options = {
        position: 0,
        manifests: manifests,
        dependenciesList: dependenciesToUse,
        commands: commands
      };
      executeCommands(options);
    }
  } else {
    log.warn(`No dependencies found in the current location`);
    return false;
  }
};
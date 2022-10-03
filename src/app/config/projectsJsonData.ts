import * as fs from 'fs';
import * as _ from 'lodash';

export type Client = string;
//export type AvailableTemplates = Set<string>;

export class AvailableTemplates extends Set<string> { }
export class ClientCollection extends Map<Client, AvailableTemplates> {

  /// Overriding base implementation to ensure Set<string> is initialized.
  override set(key: Client | string, value: AvailableTemplates): this {
    if (!value)
      throw Error("must past a defined set of supported templates");
    super.set(key as Client, value);
    return this;
  }

  add(clientName: string, templateName: string): void {
    if (super.get(clientName as unknown as Client)) {
        super.get(clientName).add(templateName);
    } else {
      const collection = new AvailableTemplates();
      collection.add(templateName);
      this.set(clientName, collection as unknown as AvailableTemplates);
    }
  }
}


export default class projectsJsonData {
  m_projectJsonDataFile = '/projectProperties.json';
  m_projectJsonData;
  _clientTemplateCollection: ClientCollection;
  get clientTemplateCollection (){
    return this._clientTemplateCollection;
  }

  constructor(templatePath: string) {
    const jsonData = fs.readFileSync(templatePath + this.m_projectJsonDataFile);
    this.m_projectJsonData = JSON.parse(jsonData.toString());
    this._clientTemplateCollection = this.processDataforHostAndTemplates(this.m_projectJsonData);
  }


  processDataforHostAndTemplates(data:any) :ClientCollection {
    const client_collection: ClientCollection = new ClientCollection();
    if (data) {
      for (const projectType in this.m_projectJsonData.projectTypes) {
        const hostArray: string[] = this.m_projectJsonData.projectTypes[projectType].supportedHosts;
        hostArray.map(host => {
          client_collection.add(host, projectType);
        })
      }
    }
    return client_collection;
  }

  isValidInput(input: string, isHostParam: boolean) {
    if (isHostParam) {
      for (const key in this.m_projectJsonData.hostTypes) {
        if (_.toLower(input) == key) {
          return true;
        }
      }
      return false;
    }
    else {
      for (const key in this.m_projectJsonData.projectTypes) {
        if (_.toLower(input) == key) {
          return true;
        }
      }
      return false;
    }
  }

  getProjectDisplayName(projectType: string) {
    return this.m_projectJsonData.projectTypes[_.toLower(projectType)].displayname;
  }

  getParsedProjectJsonData() {
    return this.m_projectJsonData;
  }

  getProjectTemplateNames() {
    const projectTemplates: string[] = [];
    for (const key in this.m_projectJsonData.projectTypes) {
      projectTemplates.push(key);
    }
    return projectTemplates;
  }

  projectBothScriptTypes(projectType: string) {
    return this.m_projectJsonData.projectTypes[_.toLower(projectType)].templates.javascript != undefined && this.m_projectJsonData.projectTypes[_.toLower(projectType)].templates.typescript != undefined;
  }

  getManifestPath(projectType: string): string | undefined {
    return this.m_projectJsonData.projectTypes[projectType].manifestPath;
  }

  // Adding Support to retrieve list of supported hosts across all templates and types.
  getSupportedHosts(): string[] {
    const hosts: Set<string> = new Set();
    for (const projectType in this.m_projectJsonData.projectTypes) {
      const hostArray: string[] = this.m_projectJsonData.projectTypes[projectType].supportedHosts;
      hostArray.map(host => {
        hosts.add(host);
      })
    }
    return Array.from(hosts);
  }

  getHostTemplateNames(projectType: string) {
    let hosts: string[] = [];
    for (const key in this.m_projectJsonData.projectTypes) {
      if (key === projectType) {
        hosts = this.m_projectJsonData.projectTypes[key].supportedHosts;
      }
    }
    return hosts;
  }

  getSupportedScriptTypes(projectType: string) {
    const scriptTypes: string[] = [];
    for (const template in this.m_projectJsonData.projectTypes[projectType].templates) {
      let scriptType: string;
      if (template === "javascript") {
        scriptType = "JavaScript";
      } else if (template === "typescript") {
        scriptType = "TypeScript";
      }

      scriptTypes.push(scriptType);
    }
    return scriptTypes;
  }

  getHostDisplayName(hostKey: string) {
    for (const key in this.m_projectJsonData.hostTypes) {
      if (_.toLower(hostKey) == key) {
        return this.m_projectJsonData.hostTypes[key].displayname;
      }
    }
    return undefined;
  }

  getProjectTemplateRepository(projectTypeKey: string, scriptType: string) {
    for (const key in this.m_projectJsonData.projectTypes) {
      if (_.toLower(projectTypeKey) == key) {
        if (projectTypeKey == 'manifest') {
          return this.m_projectJsonData.projectTypes[key].templates.manifestonly.repository;
        }
        else {
          return this.m_projectJsonData.projectTypes[key].templates[scriptType].repository;
        }
      }
    }
    return undefined;
  }

  getProjectTemplateBranchName(projectTypeKey: string, scriptType: string, prerelease: boolean) {
    for (const key in this.m_projectJsonData.projectTypes) {
      if (_.toLower(projectTypeKey) == key) {
        if (projectTypeKey == 'manifest') {
          return this.m_projectJsonData.projectTypes.manifest.templates.branch;
        }
        else {
          if (prerelease) {
            return this.m_projectJsonData.projectTypes[key].templates[scriptType].prerelease
          } else {
            return this.m_projectJsonData.projectTypes[key].templates[scriptType].branch;
          }
        }
      }
    }
    return undefined;
  }

  getProjectRepoAndBranch(projectTypeKey: string, scriptType: string, prerelease: boolean) {
    scriptType = scriptType === 'ts' ? 'typescript' : 'javascript';
    const repoBranchInfo = { repo: <string>null, branch: <string>null };

    repoBranchInfo.repo = this.getProjectTemplateRepository(projectTypeKey, scriptType);
    repoBranchInfo.branch = (repoBranchInfo.repo) ? this.getProjectTemplateBranchName(projectTypeKey, scriptType, prerelease) : undefined;

    return repoBranchInfo;
  }
}
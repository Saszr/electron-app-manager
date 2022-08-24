import GithubRepo from './Github';
import AzureRepo from './Azure';
import SwarmRepo from './Swarm';
import BintrayRepo from './Bintray';
export declare const getRepository: (urlString: string, modifiers?: any, filter?: any, prefix?: string | undefined) => GithubRepo | AzureRepo | SwarmRepo | BintrayRepo;

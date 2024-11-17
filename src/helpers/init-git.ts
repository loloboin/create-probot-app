import * as fs from "node:fs";
import * as path from "node:path";
import { execa } from "execa";
import simplegit from "simple-git";

import { green, yellow, red } from "./write-help.js";

function isInGitRepo(path: string): boolean {
  const gitRevParse = execa("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: path,
    stdio: "ignore",
  });

  if (gitRevParse.exitCode === 0) {
    console.log("Found already initialized Git repository");
    return true;
  }
  return false;
}

function isGitInstalled(): boolean {
  try {
    execa("git", ["--version"], {
      stdio: "ignore",
    });
  } catch (error: any) {
    console.log("`git` binary not found");
    return false;
  }
  return true;
}

/**
 * Initialize a Git repository in target destination folder
 *
 * @param {String} destination the destination folder path
 */
export async function initGit(destination: string): Promise<void> {
  let initializedGit = false;

  console.log(`\nInitializing Git repository in folder '${destination}'`);

  if (!isGitInstalled() || isInGitRepo(destination)) {
    console.log(yellow("Skipping Git initialization"));
    return;
  }

  const git = simplegit(destination);

  try {
    await git
      .init()
      .then(() => (initializedGit = true))
      .then(() => git.add("./*"))
      .then(() => git.commit("Initial commit from Create Probot App"))
      .then(() => console.log(green("Initialized a Git repository")));
  } catch (error) {
    if (initializedGit) {
      const gitFolder = path.join(destination, ".git");
      console.log(red(`Cleaning up ${gitFolder} folder`));
      try {
        fs.rmdirSync(gitFolder);
      } catch {}
    }
    console.log(red(`Errors while initializing Git repo: ${error}`));
  }
}

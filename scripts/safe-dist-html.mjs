// Collect generated HTML safely before postbuild mutates it.
// lstat() deliberately refuses symbolic links instead of following them
// outside dist. Hardlinked HTML must also be refused: writing it would
// modify the same inode through a path outside the build output.
import { lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function listBuildHtmlFiles(root) {
  const result = [];
  const info = lstatSync(root);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error('Build output root must be a real directory');
  }
  const visit = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const details = lstatSync(path);
      if (details.isSymbolicLink()) {
        throw new Error('Build output contains a symbolic link');
      }
      if (details.isDirectory()) {
        visit(path);
      } else if (details.isFile()) {
        if (path.endsWith('.html')) {
          if (details.nlink !== 1) {
            throw new Error('Build output HTML must not have hardlinks');
          }
          result.push(path);
        }
      } else {
        throw new Error('Build output contains a non-regular entry');
      }
    }
  };
  visit(root);
  return result;
}
